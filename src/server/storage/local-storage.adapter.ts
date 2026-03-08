import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { StorageAdapter, UploadObjectInput } from './storage-adapter';

/**
 * 本地存储适配器
 * 文件写入到 public/uploads 下，通过 /uploads/* 访问。
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir = path.join(process.cwd(), 'public')) {
    this.baseDir = baseDir;
  }

  async uploadObject(input: UploadObjectInput): Promise<void> {
    const fullPath = path.join(this.baseDir, input.path);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);
  }

  async deleteObject(objectPath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, objectPath);
    try {
      await unlink(fullPath);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getPublicUrl(objectPath: string): string {
    return `/${objectPath.replace(/^\/+/, '')}`;
  }
}
