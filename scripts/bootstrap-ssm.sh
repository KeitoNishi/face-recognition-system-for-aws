#!/bin/bash
set -euo pipefail

# 初期SSMパラメータ投入スクリプト
# 使い方: REGION=ap-northeast-1 PREFIX=/charmy/prod ./scripts/bootstrap-ssm.sh

REGION="${REGION:-ap-northeast-1}"
PREFIX="${PREFIX:-/charmy/prod}"

echo "Region: ${REGION}"
echo "Path Prefix: ${PREFIX}"

put_param() {
  local name="$1"; shift
  local value="$1"; shift
  local type="${1:-String}"
  aws ssm put-parameter \
    --region "${REGION}" \
    --name "${PREFIX}${name}" \
    --value "${value}" \
    --type "${type}" \
    --overwrite >/dev/null
  echo "put ${PREFIX}${name} (${type})"
}

# 認証関連
put_param "/auth/userCommonPassword" "CHANGE_ME_STRONG" "SecureString"

# ギャラリー・S3関連
put_param "/s3/bucketName" "<your-photo-bucket>"
put_param "/s3/region" "${REGION}"

# Rekognition
put_param "/rekognition/collectionId" "${PREFIX##*/}-faces"

# アプリ設定
put_param "/app/baseUrl" "https://example.com"
put_param "/app/allowedVenues" "venue_01,venue_02"

echo "Done."

