#!/usr/bin/env node

const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3')
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')

async function loadConfigFromParameterStore() {
  const ssm = new SSMClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
  const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
  const parameterPath = `/face-recognition/${environment}/config`
  const res = await ssm.send(new GetParameterCommand({ Name: parameterPath, WithDecryption: true }))
  if (!res.Parameter || !res.Parameter.Value) throw new Error('Parameter not found')
  const raw = JSON.parse(res.Parameter.Value)
  return {
    bucket: raw.aws.s3Bucket,
  }
}

function isImageKey(key) {
  const lower = key.toLowerCase()
  if (!(lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif'))) return false
  const filename = key.split('/').pop() || ''
  if (filename.includes('_320.') || filename.includes('_480.') || filename.includes('_640.') || filename.includes('_1280.')) return false
  return true
}

async function listVenuePrefixes(s3, bucket) {
  const prefixes = []
  // Use delimiter to get first-level directories under venues/
  const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'venues/', Delimiter: '/' }))
  const cps = out.CommonPrefixes || []
  for (const cp of cps) {
    const p = cp.Prefix || ''
    if (/^venues\/venue_\d{2}\/$/.test(p)) prefixes.push(p)
  }
  return prefixes
}

async function listAllKeys(s3, bucket, prefix) {
  const keys = []
  let token
  do {
    const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 1000, ContinuationToken: token }))
    const contents = out.Contents || []
    for (const o of contents) if (o.Key) keys.push(o.Key)
    token = out.IsTruncated ? out.NextContinuationToken : undefined
  } while (token)
  return keys
}

async function main() {
  try {
    const { bucket } = await loadConfigFromParameterStore()
    const region = process.env.AWS_REGION || 'ap-northeast-1'
    const s3 = new S3Client({ region })

    console.log(`Target bucket: ${bucket}`)

    const venuePrefixes = await listVenuePrefixes(s3, bucket)
    console.log(`Found venues: ${venuePrefixes.map(p => p.replace('venues/','').replace('/','')).join(', ')}`)

    for (const prefix of venuePrefixes) {
      const venueId = prefix.split('/')[1] // venues/venue_XX/
      process.stdout.write(`Generating manifest for ${venueId} ... `)

      const keys = await listAllKeys(s3, bucket, prefix)
      const imageKeys = keys.filter(isImageKey)

      const photos = imageKeys.map(k => ({
        id: k,
        filename: k.split('/').pop() || '',
        s3Key: k,
        thumbUrl: `/api/photos/thumb?s3Key=${encodeURIComponent(k)}&w=480`,
      }))

      const body = JSON.stringify({
        venueId,
        total: photos.length,
        generatedAt: new Date().toISOString(),
        photos,
      })

      const put = new PutObjectCommand({
        Bucket: bucket,
        Key: `manifests/${venueId}.json`,
        Body: body,
        ContentType: 'application/json',
        CacheControl: 'public, max-age=3600',
      })
      await s3.send(put)
      console.log(`ok (${photos.length} photos)`)    
    }

    console.log('All manifests generated.')
  } catch (e) {
    console.error('generate-manifests failed:', e)
    process.exit(1)
  }
}

main() 