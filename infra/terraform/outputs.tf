output "s3_bucket_name" {
  value = aws_s3_bucket.photos.bucket
}

output "instance_public_ip" {
  value = aws_instance.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

