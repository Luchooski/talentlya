import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';

const {
  S3_ENDPOINT,
  S3_REGION = 'auto',
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_PUBLIC_BASE_URL,
  ALLOW_LOCAL_FILE_STORAGE,
  NODE_ENV,
} = process.env;

const useLocal = (ALLOW_LOCAL_FILE_STORAGE === 'true') || (!S3_ENDPOINT && NODE_ENV !== 'production');

let s3: S3Client | null = null;
if (!useLocal) {
  s3 = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID || '', secretAccessKey: S3_SECRET_ACCESS_KEY || '' },
  });
}

export async function saveBuffer(key: string, contentType: string, buf: Buffer) {
  if (useLocal) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const filePath = path.join(uploadsDir, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buf);
    const url = `/uploads/${key}`; // servilo estático en dev
    return { url };
  }

  if (!s3 || !S3_BUCKET) throw new Error('S3 storage not configured');

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key: key, Body: buf, ContentType: contentType || 'application/octet-stream', ACL: 'private'
  }));

  const base = S3_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  const url = base ? `${base}/${encodeURIComponent(key)}` : `s3://${S3_BUCKET}/${key}`;
  return { url };
}
