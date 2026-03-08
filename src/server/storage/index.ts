import { LocalStorageAdapter } from './local-storage.adapter';
import type { StorageAdapter } from './storage-adapter';

let storageAdapter: StorageAdapter | null = null;

/**
 * 获取当前存储适配器
 * 当前阶段默认使用本地存储，后续可扩展 S3 适配器。
 */
export function getStorageAdapter(): StorageAdapter {
  if (storageAdapter) {
    return storageAdapter;
  }

  const storageType = process.env.STORAGE_TYPE ?? 'local';
  if (storageType !== 'local') {
    throw new Error(`Unsupported STORAGE_TYPE: ${storageType}`);
  }

  storageAdapter = new LocalStorageAdapter();
  return storageAdapter;
}
