declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string

    // AWS
    AWS_REGION: string
    AWS_ACCESS_KEY_ID: string
    AWS_SECRET_ACCESS_KEY: string

    // S3
    S3_BUCKET_NAME: string

    // Rekognition
    REKOGNITION_COLLECTION_ID: string

    // Auth
    ADMIN_USERNAME: string
    ADMIN_PASSWORD: string
    USER_PASSWORD: string
  }
}
