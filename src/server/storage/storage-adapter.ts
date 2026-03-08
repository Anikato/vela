export interface UploadObjectInput {
  path: string;
  buffer: Buffer;
}

export interface StorageAdapter {
  uploadObject(input: UploadObjectInput): Promise<void>;
  deleteObject(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}
