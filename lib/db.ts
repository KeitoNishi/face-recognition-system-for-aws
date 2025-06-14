import postgres from "postgres"
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import { logger } from "./logger"

const ssm = new SSMClient({ region: "ap-northeast-1" });

async function getParameter(name: string) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });
  const response = await ssm.send(command);
  if (!response.Parameter?.Value) throw new Error(`Parameter ${name} not found`);
  return response.Parameter.Value;
}

let sql: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (sql) return sql;
  const databaseUrl = await getParameter("/face-recognition-system/test/databaseUrl");
  sql = postgres(databaseUrl, {
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  });
  return sql;
}

export async function query(text: string, params?: any[]) {
  const sql = await getDb();
  try {
    const start = Date.now();
    const res = await sql.unsafe(text, params || []);
    const duration = Date.now() - start;
    logger.dbQuery(text, { duration, rows: res.length });
    return { rows: res, rowCount: res.length };
  } catch (error) {
    logger.error("Error executing query", { error });
    throw error;
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

export async function getPhotoCountByVenueId(venueId: number) {
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
