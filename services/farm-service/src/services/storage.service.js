// AWS S3: the browser uploads photos directly to S3 with a short-lived
// presigned URL, so file bytes never pass through this service.
import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
let client = null;

function s3() {
  if (!env.S3_BUCKET) throw new HttpError(503, "Photo uploads are not configured (set S3_BUCKET)");
  // Credentials come from the default AWS chain: env vars, ~/.aws, or the IAM role on ECS/EC2.
  client ??= new S3Client({ region: env.AWS_REGION });
  return client;
}

export function photoKeyPrefix(fieldId) {
  return `fields/${fieldId}/`;
}

export async function createPhotoUpload(fieldId, { contentType, size }) {
  const key = `${photoKeyPrefix(fieldId)}${randomUUID()}.${EXT[contentType]}`;
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size, // signed: S3 rejects a different size
  });
  const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: 300 });
  return { key, uploadUrl, method: "PUT", headers: { "Content-Type": contentType }, expiresIn: 300 };
}

export function publicUrl(key) {
  const base = env.S3_PUBLIC_BASE_URL ?? `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  return `${base}/${key}`;
}
