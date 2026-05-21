import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import { env } from '../../config/env';

const DEFAULT_LOCAL_PATH = path.resolve(process.cwd(), '..', 'storage');

/**
 * Normaliza o caminho do artefato: aceita tanto `gs://bucket/path` quanto `path`
 * e retorna sempre o path relativo ao bucket.
 */
function normalizePath(filePath: string): string {
  if (!filePath.startsWith('gs://')) return filePath;
  const withoutScheme = filePath.slice(5);
  const slashIdx = withoutScheme.indexOf('/');
  return slashIdx === -1 ? withoutScheme : withoutScheme.slice(slashIdx + 1);
}

export class StorageClient {
  private storage: Storage | null;
  private bucketName: string;
  private localBasePath: string;
  private isLocal: boolean;

  constructor() {
    this.isLocal = env.STORAGE_DRIVER === 'local';
    this.bucketName = env.GCS_BUCKET || 'atmos-agro-data-lake-dev';
    this.localBasePath = env.LOCAL_STORAGE_PATH || DEFAULT_LOCAL_PATH;
    this.storage = this.isLocal ? null : new Storage();
  }

  getReadStream(filePath: string) {
    const normalized = normalizePath(filePath);
    if (this.isLocal) {
      return createReadStream(path.join(this.localBasePath, normalized));
    }
    return this.storage!.bucket(this.bucketName).file(normalized).createReadStream();
  }

  async downloadBuffer(filePath: string): Promise<Buffer> {
    const normalized = normalizePath(filePath);
    if (this.isLocal) {
      return fs.readFile(path.join(this.localBasePath, normalized));
    }
    const [contents] = await this.storage!.bucket(this.bucketName).file(normalized).download();
    return contents;
  }

  async getSignedUrl(filePath: string, expiresIn: number = 15 * 60): Promise<string> {
    const normalized = normalizePath(filePath);
    if (this.isLocal) {
      const err = new Error('Local storage driver does not support signed URLs.');
      err.name = 'StorageUnsupported';
      throw err;
    }
    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    };
    const [url] = await this.storage!.bucket(this.bucketName).file(normalized).getSignedUrl(options);
    return url;
  }

  async exists(filePath: string): Promise<boolean> {
    const normalized = normalizePath(filePath);
    if (this.isLocal) {
      try {
        await fs.access(path.join(this.localBasePath, normalized));
        return true;
      } catch {
        return false;
      }
    }
    const [exists] = await this.storage!.bucket(this.bucketName).file(normalized).exists();
    return exists;
  }
}

export const storageClient = new StorageClient();
