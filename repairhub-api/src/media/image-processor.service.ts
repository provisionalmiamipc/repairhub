import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

export interface ProcessedImageVariant {
  buffer: Buffer;
  size: number;
  width?: number;
  height?: number;
}

export interface ProcessedImage {
  mimeType: string;
  display: ProcessedImageVariant;
  thumbnail: ProcessedImageVariant;
}

@Injectable()
export class ImageProcessorService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    sharp.cache(false);
    sharp.concurrency(Number(this.configService.get('SHARP_CONCURRENCY') ?? 1));
    sharp.simd(true);
  }

  async process(file: Express.Multer.File): Promise<ProcessedImage> {
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('El archivo no es una imagen valida');
    }

    const display = await this.toTargetWebp(file.buffer, {
      maxWidth: Number(this.configService.get('IMAGE_DISPLAY_MAX_WIDTH') ?? 1280),
      maxBytes: Number(this.configService.get('IMAGE_DISPLAY_MAX_BYTES') ?? 200 * 1024),
      initialQuality: Number(this.configService.get('IMAGE_DISPLAY_QUALITY') ?? 75),
      minQuality: Number(this.configService.get('IMAGE_DISPLAY_MIN_QUALITY') ?? 55),
    });

    const thumbnail = await this.toTargetWebp(file.buffer, {
      maxWidth: Number(this.configService.get('IMAGE_THUMBNAIL_MAX_WIDTH') ?? 320),
      maxBytes: Number(this.configService.get('IMAGE_THUMBNAIL_MAX_BYTES') ?? 25 * 1024),
      initialQuality: Number(this.configService.get('IMAGE_THUMBNAIL_QUALITY') ?? 60),
      minQuality: Number(this.configService.get('IMAGE_THUMBNAIL_MIN_QUALITY') ?? 45),
    });

    return {
      mimeType: 'image/webp',
      display,
      thumbnail,
    };
  }

  private async toTargetWebp(
    input: Buffer,
    options: {
      maxWidth: number;
      maxBytes: number;
      initialQuality: number;
      minQuality: number;
    },
  ): Promise<ProcessedImageVariant> {
    let width = options.maxWidth;
    let quality = options.initialQuality;
    let last: Buffer | null = null;
    let info: sharp.OutputInfo | null = null;

    while (width >= 640 || quality >= options.minQuality) {
      const result = await sharp(input)
        .rotate()
        .resize({
          width,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      last = result.data;
      info = result.info;

      if (result.data.length <= options.maxBytes) break;

      if (quality > options.minQuality) {
        quality = Math.max(options.minQuality, quality - 8);
      } else {
        width = Math.floor(width * 0.85);
      }
    }

    if (!last || !info) {
      throw new BadRequestException('No se pudo procesar la imagen');
    }

    return {
      buffer: last,
      size: last.length,
      width: info.width,
      height: info.height,
    };
  }
}
