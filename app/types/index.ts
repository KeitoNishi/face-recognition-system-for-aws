export interface Photo {
  id: string
  filename: string
  s3Key: string
  url: string
  thumbUrl?: string
  matched: boolean
  confidence?: number
  size?: number
  lastModified?: Date
}

export interface VenueInfo {
  id: string
  name: string
  location: string
  path: string
}

export interface SessionState {
  authenticated: boolean
  loading: boolean
  faceInfo?: any
}

export interface FilterState {
  isFiltering: boolean
  filterProgress: number
  showAllPhotos: boolean
  hasFace: boolean
} 