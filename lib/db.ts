import { Pool } from "pg"

// PostgreSQLへの接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error executing query", error)
    throw error
  }
}

export async function getVenues() {
  const result = await query("SELECT * FROM venues ORDER BY name")
  return result.rows
}

export async function getVenueById(id: number) {
  const result = await query("SELECT * FROM venues WHERE id = $1", [id])
  return result.rows[0]
}

export async function getPhotosByVenueId(venueId: number) {
  const result = await query("SELECT * FROM photos WHERE venue_id = $1 ORDER BY uploaded_at DESC", [venueId])
  return result.rows
}

export async function getPhotoCountByVenueId(venueId: number): Promise<number> {
  const result = await query("SELECT COUNT(*) as count FROM photos WHERE venue_id = $1", [venueId])
  return parseInt(result.rows[0].count)
}

export async function createVenue(name: string) {
  const result = await query("INSERT INTO venues (name, created_at) VALUES ($1, NOW()) RETURNING *", [name])
  return result.rows[0]
}

export async function createPhoto(venueId: number, filename: string, s3Key: string) {
  const result = await query(
    "INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [venueId, filename, s3Key],
  )
  return result.rows[0]
}

export async function saveUserFace(photoPath: string, faceId: string, name?: string) {
  const result = await query(
    "INSERT INTO users (name, photo_path, face_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [name || null, photoPath, faceId],
  )
  return result.rows[0]
}
