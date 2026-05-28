import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MediaAsset } from './entities/media-asset.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { ImageProcessorService } from './image-processor.service';
import { GoogleStorageService } from './google-storage.service';
import { MediaAssetResponseDto } from './dto/media-asset-response.dto';

interface QueuedImageJob {
  assetId: number;
  file: Express.Multer.File;
}

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly queue: QueuedImageJob[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(MediaAsset)
    private readonly mediaRepository: Repository<MediaAsset>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    private readonly imageProcessor: ImageProcessorService,
    private readonly storageService: GoogleStorageService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.mediaRepository.update(
        { status: In(['pending', 'processing']) },
        {
          status: 'failed',
          error:
            'La imagen no pudo procesarse porque el servidor se reinicio antes de terminar.',
        },
      );
    } catch (error) {
      if (this.isMissingMediaTableError(error)) {
        this.logger.warn(
          'La tabla media_assets no existe. Ejecuta la migracion antes de usar imagenes.',
        );
        return;
      }

      throw error;
    }
  }

  async createImageAssets(params: {
    ownerType: string;
    ownerId: number;
    files: Express.Multer.File[];
    kinds?: string[];
  }) {
    const files = params.files ?? [];
    if (!files.length) return [];

    await this.validateImageChange({
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      files,
    });

    const currentMaxSort =
      (await this.mediaRepository.maximum('sortOrder', {
        ownerType: params.ownerType,
        ownerId: params.ownerId,
      })) ?? 0;

    const assets = await this.mediaRepository.save(
      files.map((file, index) =>
        this.mediaRepository.create({
          ownerType: params.ownerType,
          ownerId: params.ownerId,
          bucket: this.storageService.getBucketName(),
          originalName: file.originalname,
          kind: this.normalizeMediaKind(params.kinds?.[index]),
          status: 'pending',
          sortOrder: currentMaxSort + index + 1,
        }),
      ),
    );

    assets.forEach((asset, index) =>
      this.enqueue({ assetId: asset.id, file: files[index] }),
    );

    return this.withSignedUrls(assets);
  }

  async validateImageChange(params: {
    ownerType: string;
    ownerId?: number;
    files: Express.Multer.File[];
    deleteImageIds?: number[];
  }) {
    const files = params.files ?? [];
    const deleteImageIds = new Set(
      (params.deleteImageIds ?? []).map(Number).filter(Boolean),
    );
    const maxImages = Number(this.configService.get('IMAGE_MAX_COUNT') ?? 6);

    if (files.length || deleteImageIds.size) {
      this.storageService.assertConfigured();
      await this.ensureMediaTableReady();
    }

    let currentCount = 0;
    if (params.ownerId) {
      const currentAssets = await this.safeFindCurrentAssetsForValidation(
        params.ownerType,
        params.ownerId,
      );
      currentCount = currentAssets.filter(
        (asset) => !deleteImageIds.has(asset.id),
      ).length;
    }

    if (currentCount + files.length > maxImages) {
      throw new BadRequestException(
        `Solo se permiten ${maxImages} imagenes por registro.`,
      );
    }

    files.forEach((file) => this.validateImage(file));
  }

  async findByOwner(ownerType: string, ownerId: number, user?: any) {
    await this.assertCanAccessOwner(ownerType, ownerId, user);
    const assets = await this.safeFindAssetsByOwner(ownerType, ownerId);

    return this.withSignedUrls(assets);
  }

  async deleteByIds(ownerType: string, ownerId: number, ids: number[]) {
    const cleanIds = [...new Set((ids ?? []).map(Number).filter(Boolean))];
    if (!cleanIds.length) return;

    await this.ensureMediaTableReady();

    const assets = await this.mediaRepository.find({
      where: {
        id: In(cleanIds),
        ownerType,
        ownerId,
        status: Not('deleted'),
      },
    });

    for (const asset of assets) {
      await this.markDeleted(asset);
    }
  }

  async deleteOne(id: number, user?: any) {
    await this.ensureMediaTableReady();

    const asset = await this.mediaRepository.findOne({ where: { id } });
    if (!asset || asset.status === 'deleted') {
      throw new NotFoundException(`Media asset #${id} not found`);
    }

    await this.assertCanAccessAsset(asset, user);
    await this.markDeleted(asset);
    return { deleted: true };
  }

  async getVariantUrl(id: number, variant: 'thumbnail' | 'display', user?: any) {
    await this.ensureMediaTableReady();

    const asset = await this.mediaRepository.findOne({ where: { id } });
    if (!asset || asset.status === 'deleted') {
      throw new NotFoundException(`Media asset #${id} not found`);
    }

    if (asset.status !== 'ready') {
      throw new BadRequestException('La imagen aun no esta disponible.');
    }

    await this.assertCanAccessAsset(asset, user);
    const key = variant === 'thumbnail' ? asset.thumbnailKey : asset.displayKey;
    const url = await this.storageService.getSignedReadUrl(key);
    return { url };
  }

  async getPdfImageBuffers(ownerType: string, ownerId: number) {
    const assets = await this.safeFindAssetsByOwner(ownerType, ownerId);
    const imageAssets = assets.filter(
      (asset) =>
        asset.status === 'ready' &&
        asset.kind !== 'signature' &&
        !!asset.displayKey,
    );

    const images: Array<{ originalName: string; buffer: Buffer }> = [];
    for (const asset of imageAssets) {
      try {
        const sourceBuffer = await this.storageService.downloadBuffer(asset.displayKey);
        if (!sourceBuffer) continue;

        images.push({
          originalName: asset.originalName,
          buffer: await this.imageProcessor.toJpegBuffer(sourceBuffer),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`No se pudo agregar media asset ${asset.id} al PDF: ${message}`);
      }
    }

    return images;
  }

  async attachImages<T extends { id: number }>(
    ownerType: string,
    entities: T | T[],
  ) {
    const list = Array.isArray(entities) ? entities : [entities];
    if (!list.length) return entities;

    const assets = await this.safeFindAssetsForOwners(
      ownerType,
      list.map((entity) => entity.id),
    );

    const byOwner = new Map<number, MediaAsset[]>();
    assets.forEach((asset) => {
      const current = byOwner.get(asset.ownerId) ?? [];
      current.push(asset);
      byOwner.set(asset.ownerId, current);
    });

    const mappedAssets = new Map<number, MediaAssetResponseDto[]>();
    for (const [ownerId, ownerAssets] of byOwner.entries()) {
      mappedAssets.set(ownerId, await this.withSignedUrls(ownerAssets));
    }

    const mapped = list.map((entity) => ({
      ...entity,
      images: mappedAssets.get(entity.id) ?? [],
    }));

    return Array.isArray(entities) ? mapped : mapped[0];
  }

  private validateImage(file: Express.Multer.File) {
    const maxInputBytes = Number(
      this.configService.get('IMAGE_MAX_INPUT_BYTES') ?? 5 * 1024 * 1024,
    );
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten imagenes jpg, png, webp, heic o heif.',
      );
    }

    if (file.size > maxInputBytes) {
      throw new BadRequestException(
        `Cada imagen debe pesar maximo ${Math.floor(maxInputBytes / 1024 / 1024)}MB.`,
      );
    }
  }

  private enqueue(job: QueuedImageJob) {
    this.queue.push(job);
    void this.processNext();
  }

  private async processNext() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length) {
        const job = this.queue.shift();
        if (!job) continue;
        await this.processJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: QueuedImageJob) {
    const asset = await this.mediaRepository.findOne({
      where: { id: job.assetId },
    });
    if (!asset || asset.status === 'deleted') return;

    await this.mediaRepository.update(asset.id, {
      status: 'processing',
      error: null,
    });

    try {
      const processed = await this.imageProcessor.process(job.file);
      const baseKey = `${asset.ownerType}/${asset.ownerId}/${randomUUID()}`;
      const displayKey = `${baseKey}-display.webp`;
      const thumbnailKey = `${baseKey}-thumbnail.webp`;

      await this.storageService.uploadBuffer({
        key: displayKey,
        buffer: processed.display.buffer,
        contentType: processed.mimeType,
      });
      await this.storageService.uploadBuffer({
        key: thumbnailKey,
        buffer: processed.thumbnail.buffer,
        contentType: processed.mimeType,
      });

      const current = await this.mediaRepository.findOne({
        where: { id: asset.id },
      });
      if (!current || current.status === 'deleted') {
        await this.safeDeleteFile(displayKey);
        await this.safeDeleteFile(thumbnailKey);
        return;
      }

      await this.mediaRepository.update(asset.id, {
        status: 'ready',
        displayKey,
        thumbnailKey,
        mimeType: processed.mimeType,
        displaySize: processed.display.size,
        thumbnailSize: processed.thumbnail.size,
        width: processed.display.width,
        height: processed.display.height,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing media asset ${asset.id}: ${message}`);
      await this.mediaRepository.update(asset.id, {
        status: 'failed',
        error: message,
      });
    }
  }

  private async markDeleted(asset: MediaAsset) {
    await this.mediaRepository.update(asset.id, {
      status: 'deleted',
      error: null,
    });

    await Promise.all([
      this.safeDeleteFile(asset.displayKey),
      this.safeDeleteFile(asset.thumbnailKey),
    ]);
  }

  private async withSignedUrls(
    assets: MediaAsset[],
  ): Promise<MediaAssetResponseDto[]> {
    return Promise.all(
      assets.map(async (asset) => ({
        id: asset.id,
        ownerType: asset.ownerType,
        ownerId: asset.ownerId,
        kind: asset.kind,
        status: asset.status,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        displaySize: asset.displaySize,
        thumbnailSize: asset.thumbnailSize,
        width: asset.width,
        height: asset.height,
        thumbnailUrl:
          asset.status === 'ready'
            ? await this.safeGetSignedReadUrl(asset.thumbnailKey, asset.id)
            : undefined,
        error: asset.error,
      })),
    );
  }

  private normalizeMediaKind(kind?: string): string {
    return kind === 'signature' ? 'signature' : 'image';
  }

  private async assertCanAccessAsset(asset: MediaAsset, user?: any) {
    await this.assertCanAccessOwner(asset.ownerType, asset.ownerId, user);
  }

  private async assertCanAccessOwner(ownerType: string, ownerId: number, user?: any) {
    if (!user) {
      throw new ForbiddenException('Authentication required to access media.');
    }

    if (user.type === 'user') {
      return;
    }

    if (ownerType !== this.configuredServiceOrderOwnerType()) {
      throw new ForbiddenException('You do not have permission to access this media.');
    }

    const order = await this.serviceOrderRepository.findOne({
      where: { id: ownerId },
      select: {
        id: true,
        centerId: true,
        storeId: true,
        assignedTechId: true,
        createdById: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Service order #${ownerId} not found`);
    }

    if (this.canEmployeeAccessServiceOrder(user, order)) {
      return;
    }

    throw new ForbiddenException('You do not have permission to access this media.');
  }

  private configuredServiceOrderOwnerType() {
    return 'service_order';
  }

  private canEmployeeAccessServiceOrder(user: any, order: Pick<ServiceOrder, 'centerId' | 'storeId' | 'assignedTechId' | 'createdById'>) {
    if (user?.type !== 'employee') return false;

    const employeeId = Number(user.employeeId ?? user.sub ?? user.id);
    const employeeType = user.employee_type ?? user.role;
    const isCenterAdmin = !!user.isCenterAdmin;

    if (employeeType === 'Expert' && !isCenterAdmin) {
      return order.createdById === employeeId || order.assignedTechId === employeeId;
    }

    // Mirrors the current service-order list behavior: non-expert employees are not
    // narrowed further yet. This keeps media access aligned with visible orders.
    return true;
  }

  private async safeGetSignedReadUrl(key: string | null | undefined, assetId: number) {
    try {
      return await this.storageService.getSignedReadUrl(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `No se pudo generar URL firmada para media asset ${assetId}: ${message}`,
      );
      return undefined;
    }
  }

  private async safeDeleteFile(key: string | null | undefined) {
    try {
      await this.storageService.deleteFile(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo borrar archivo de storage ${key}: ${message}`);
    }
  }

  private async ensureMediaTableReady() {
    try {
      await this.mediaRepository.query('SELECT 1 FROM "media_assets" LIMIT 1');
    } catch (error) {
      if (this.isMissingMediaTableError(error)) {
        throw new ServiceUnavailableException(
          'La tabla media_assets no existe. Ejecuta la migracion de base de datos antes de usar imagenes.',
        );
      }

      throw error;
    }
  }

  private async safeFindCurrentAssetsForValidation(
    ownerType: string,
    ownerId: number,
  ) {
    try {
      return await this.mediaRepository.find({
        select: { id: true },
        where: {
          ownerType,
          ownerId,
          status: Not('deleted'),
        },
      });
    } catch (error) {
      if (this.isMissingMediaTableError(error)) {
        throw new ServiceUnavailableException(
          'La tabla media_assets no existe. Ejecuta la migracion de base de datos antes de usar imagenes.',
        );
      }

      throw error;
    }
  }

  private async safeFindAssetsByOwner(ownerType: string, ownerId: number) {
    try {
      return await this.mediaRepository.find({
        where: {
          ownerType,
          ownerId,
          status: Not('deleted'),
        },
        order: {
          sortOrder: 'ASC',
          id: 'ASC',
        },
      });
    } catch (error) {
      if (this.isMissingMediaTableError(error)) {
        this.logger.warn('La tabla media_assets no existe; devolviendo imagenes vacias.');
        return [];
      }

      throw error;
    }
  }

  private async safeFindAssetsForOwners(ownerType: string, ownerIds: number[]) {
    try {
      return await this.mediaRepository.find({
        where: {
          ownerType,
          ownerId: In(ownerIds),
          status: Not('deleted'),
        },
        order: {
          sortOrder: 'ASC',
          id: 'ASC',
        },
      });
    } catch (error) {
      if (this.isMissingMediaTableError(error)) {
        this.logger.warn('La tabla media_assets no existe; devolviendo imagenes vacias.');
        return [];
      }

      throw error;
    }
  }

  private isMissingMediaTableError(error: unknown) {
    const candidate = error as {
      code?: string;
      driverError?: { code?: string };
      message?: string;
    };
    const message = candidate?.message ?? '';

    return (
      candidate?.code === '42P01' ||
      candidate?.driverError?.code === '42P01' ||
      message.includes('relation "media_assets" does not exist')
    );
  }
}
