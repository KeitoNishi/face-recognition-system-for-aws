import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseUrl, getS3Bucket, getAwsCredentials } from '@/lib/ssm';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger, measureDurationAsync } from '@/lib/logger';
import postgres from 'postgres';

// データベース接続
let sql: any = null;
let s3Client: S3Client | null = null;

async function getDb() {
  if (!sql) {
    const databaseUrl = await getDatabaseUrl();
    sql = postgres(databaseUrl, {
      ssl: 'require'
    });
  }
  return sql;
}

async function getS3Client() {
  if (!s3Client) {
    const credentials = await getAwsCredentials();
    s3Client = new S3Client({
      region: 'ap-northeast-1',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }
  return s3Client;
}

// GET /api/photos?venueId=1 - 写真一覧取得
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    logger.apiRequest({
      requestId,
      method: 'GET',
      api: '/api/photos',
      metadata: {
        venueId
      }
    });

    if (!venueId) {
      logger.apiResponse({
        requestId,
        method: 'GET',
        api: '/api/photos',
        statusCode: 400,
        duration: Date.now() - startTime,
        metadata: {
          error: 'Venue ID missing'
        }
      });

      return NextResponse.json(
        { success: false, message: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const { result: photos, duration: dbDuration } = await measureDurationAsync(async () => {
      const db = await getDb();
      return await db`
        SELECT id, venue_id, filename, s3_key, uploaded_at
        FROM photos 
        WHERE venue_id = ${parseInt(venueId)}
        ORDER BY uploaded_at DESC
      `;
    });

    logger.dbQuery(`SELECT photos WHERE venue_id = ${venueId}`, {
      requestId,
      duration: dbDuration,
      metadata: {
        recordCount: photos.length
      }
    });

    // S3の署名付きURLを生成
    const s3 = await getS3Client();
    const bucket = await getS3Bucket();
    
    const { result: photosWithUrls, duration: s3Duration } = await measureDurationAsync(async () => {
      return await Promise.all(
        photos.map(async (photo) => {
          try {
            const command = new GetObjectCommand({
              Bucket: bucket,
              Key: photo.s3_key,
            });
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1時間有効
            
            return {
              id: photo.id,
              venueId: photo.venue_id,
              filename: photo.filename,
              url,
              uploadedAt: photo.uploaded_at
            };
          } catch (error) {
            logger.apiError(`Failed to generate signed URL for photo ${photo.id}`, error as Error, {
              requestId,
              metadata: {
                photoId: photo.id,
                s3Key: photo.s3_key
              }
            });
            
            return {
              id: photo.id,
              venueId: photo.venue_id,
              filename: photo.filename,
              url: null,
              uploadedAt: photo.uploaded_at
            };
          }
        })
      );
    });

    logger.s3Operation('signed-url-batch', `${photos.length} photos`, {
      requestId,
      bucket,
      duration: s3Duration,
      metadata: {
        photoCount: photos.length,
        successCount: photosWithUrls.filter(p => p.url !== null).length
      }
    });

    logger.apiResponse({
      requestId,
      method: 'GET',
      api: '/api/photos',
      statusCode: 200,
      duration: Date.now() - startTime,
      metadata: {
        photoCount: photosWithUrls.length,
        dbDuration,
        s3Duration
      }
    });

    return NextResponse.json({
      success: true,
      photos: photosWithUrls
    });
  } catch (error) {
    logger.apiError('Failed to fetch photos', error as Error, {
      requestId,
      method: 'GET',
      api: '/api/photos',
      metadata: {
        duration: Date.now() - startTime
      }
    });

    logger.apiResponse({
      requestId,
      method: 'GET',
      api: '/api/photos',
      statusCode: 500,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { success: false, message: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// POST /api/photos - 写真アップロード
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const venueId = formData.get('venueId') as string;
    const files = formData.getAll('files') as File[];

    if (!venueId || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Venue ID and files are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const s3 = await getS3Client();
    const bucket = await getS3Bucket();
    
    const uploadedPhotos = [];

    for (const file of files) {
      try {
        // ファイル名にタイムスタンプを追加してユニークにする
        const timestamp = Date.now();
        const s3Key = `prod/venues/${venueId}/${timestamp}_${file.name}`;
        
        // S3にアップロード
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
        });

        await s3.send(uploadCommand);

        // データベースに記録
        const newPhoto = await db`
          INSERT INTO photos (venue_id, filename, s3_key, uploaded_at)
          VALUES (${parseInt(venueId)}, ${file.name}, ${s3Key}, NOW())
          RETURNING id, venue_id, filename, s3_key, uploaded_at
        `;

        uploadedPhotos.push({
          id: newPhoto[0].id,
          venueId: newPhoto[0].venue_id,
          filename: newPhoto[0].filename,
          s3Key: newPhoto[0].s3_key,
          uploadedAt: newPhoto[0].uploaded_at
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // 個別のファイルエラーは続行
      }
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedPhotos.length} photos uploaded successfully`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload photos' },
      { status: 500 }
    );
  }
} 