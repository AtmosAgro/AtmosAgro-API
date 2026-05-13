import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import { env } from '../../config/env';

export class StorageClient {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = env.GCS_BUCKET || 'atmos-agro-data-lake-dev';
  }

  /**
   * Retorna um stream de leitura para um arquivo no GCS.
   * Útil para fazer proxy de arquivos sem expor URLs assinadas.
   */
  getReadStream(path: string) {
    return this.storage
      .bucket(this.bucketName)
      .file(path)
      .createReadStream();
  }

  /**
   * Gera uma URL assinada para leitura de um arquivo no GCS.
   * @param path Caminho completo do arquivo dentro do bucket (ex: processed/ID/file.tif)
   * @param expiresIn Segundos até a expiração (default 15 minutos)
   */
  async getSignedUrl(path: string, expiresIn: number = 15 * 60): Promise<string> {
    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    };

    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(path)
      .getSignedUrl(options);

    return url;
  }

  /**
   * Verifica se um arquivo existe no bucket.
   */
  async exists(path: string): Promise<boolean> {
    const [exists] = await this.storage
      .bucket(this.bucketName)
      .file(path)
      .exists();
    return exists;
  }
}

export const storageClient = new StorageClient();
