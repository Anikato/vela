import 'server-only';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';
import type { StorageAdapter } from './storage-adapter';

let storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (storageAdapter) {
    return storageAdapter;
  }

  const storageType = process.env.STORAGE_TYPE ?? 'local';

  switch (storageType) {
    case 'local':
      storageAdapter = new LocalStorageAdapter();
      break;
    case 's3':
      storageAdapter = new S3StorageAdapter();
      break;
    default:
      throw new Error(
        `Unsupported STORAGE_TYPE: "${storageType}". Use "local" or "s3".`,
      );
  }

  return storageAdapter;
}
