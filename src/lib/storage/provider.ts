/**
 * Storage Abstraction Layer
 * Supports local filesystem and cloud object storage (e.g., GCS, S3)
 */

export interface StorageUploadResult {
  url: string;
  storageKey: string;
  bytesWritten: number;
}

export interface StorageProvider {
  name: string;
  upload(fileBuffer: Buffer | Uint8Array, fileName: string, mimeType: string): Promise<StorageUploadResult>;
  get(storageKey: string): Promise<Buffer | Uint8Array>;
  delete(storageKey: string): Promise<boolean>;
}

export class MemoryOrLocalStorageProvider implements StorageProvider {
  public name = 'Local/Memory Storage';
  private storageMap = new Map<string, { buffer: Uint8Array; mimeType: string }>();

  async upload(fileBuffer: Buffer | Uint8Array, fileName: string, mimeType: string): Promise<StorageUploadResult> {
    const key = `materials/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    this.storageMap.set(key, { buffer: fileBuffer, mimeType });
    return {
      url: `/api/materials/storage/${encodeURIComponent(key)}`,
      storageKey: key,
      bytesWritten: fileBuffer.length,
    };
  }

  async get(storageKey: string): Promise<Buffer | Uint8Array> {
    const item = this.storageMap.get(storageKey);
    if (!item) {
      throw new Error(`File not found in storage: ${storageKey}`);
    }
    return item.buffer;
  }

  async delete(storageKey: string): Promise<boolean> {
    return this.storageMap.delete(storageKey);
  }
}

let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    storageInstance = new MemoryOrLocalStorageProvider();
  }
  return storageInstance;
}
