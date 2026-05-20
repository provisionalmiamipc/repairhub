import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GoogleStorageService {
  private readonly logger = new Logger(GoogleStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly configurationError?: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('GCS_BUCKET') ?? '';

    const keyFilename = this.configService.get<string>('GCS_KEY_FILE');
    const credentialsJson = this.configService.get<string>('GCS_CREDENTIALS_JSON');
    let credentials: Record<string, unknown> | undefined;

    if (credentialsJson) {
      try {
        credentials = JSON.parse(credentialsJson);
      } catch (error) {
        this.configurationError =
          'GCS_CREDENTIALS_JSON no contiene un JSON valido.';
        this.logger.error(this.configurationError);
      }
    }

    this.storage = new Storage({
      projectId: this.configService.get<string>('GCS_PROJECT_ID'),
      keyFilename: keyFilename || undefined,
      credentials,
    });
  }

  assertConfigured() {
    this.ensureConfigured();
  }

  getBucketName() {
    this.ensureConfigured();
    return this.bucketName;
  }

  async uploadBuffer(params: {
    key: string;
    buffer: Buffer;
    contentType: string;
  }) {
    this.ensureConfigured();
    await this.storage.bucket(this.bucketName).file(params.key).save(params.buffer, {
      contentType: params.contentType,
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=3600',
      },
    });
  }

  async getSignedReadUrl(key?: string | null) {
    if (!key) return undefined;
    this.ensureConfigured();

    const expiresInSeconds = Number(
      this.configService.get('GCS_SIGNED_URL_EXPIRES_SECONDS') ?? 3600,
    );
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(key)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });

    return url;
  }

  async deleteFile(key?: string | null) {
    if (!key) return;
    this.ensureConfigured();

    await this.storage.bucket(this.bucketName).file(key).delete({
      ignoreNotFound: true,
    });
  }

  private ensureConfigured() {
    if (this.configurationError) {
      throw new ServiceUnavailableException(this.configurationError);
    }

    if (!this.bucketName) {
      throw new ServiceUnavailableException(
        'Google Cloud Storage no esta configurado. Define GCS_BUCKET y credenciales.',
      );
    }
  }
}
