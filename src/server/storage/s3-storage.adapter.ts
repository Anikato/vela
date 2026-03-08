import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import type { StorageAdapter, UploadObjectInput } from './storage-adapter';

/**
 * S3/R2 兼容存储适配器
 * 支持 AWS S3、Cloudflare R2、MinIO 等 S3 兼容服务。
 */
export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? 'auto';
    const bucket = process.env.S3_BUCKET;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const publicUrl = process.env.S3_PUBLIC_URL;

    if (!endpoint || !bucket || !accessKey || !secretKey || !publicUrl) {
      throw new Error(
        'S3 storage requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL',
      );
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/$/, '');

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadObject(input: UploadObjectInput): Promise<void> {
    const key = input.path.replace(/^\/+/, '');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: guessContentType(key),
      }),
    );
  }

  async deleteObject(objectPath: string): Promise<void> {
    const key = objectPath.replace(/^\/+/, '');
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(objectPath: string): string {
    const key = objectPath.replace(/^\/+/, '');
    return `${this.publicUrl}/${key}`;
  }
}

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
}
