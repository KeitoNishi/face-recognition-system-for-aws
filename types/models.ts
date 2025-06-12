export interface Venue {
  id: number
  name: string
  created_at: Date
}

export interface Photo {
  id: number
  venue_id: number
  filename: string
  s3_key: string
  uploaded_at: Date
}

export interface User {
  id: number
  name?: string
  photo_path: string
  face_id: string
  created_at: Date
}
