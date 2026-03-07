import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { IsNull, Repository } from 'typeorm';
import { DocumentEntity } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
  ) {}

  async createFromUpload(file: Express.Multer.File, serviceOrderId?: number | null) {
    const document = this.documentRepository.create({
      serviceOrderId: serviceOrderId ?? null,
      filename: file.originalname,
      storagePath: `memory://${Date.now()}-${file.originalname}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return this.documentRepository.save(document);
  }

  async createManyFromUpload(files: Express.Multer.File[], serviceOrderId?: number | null) {
    const documents = this.documentRepository.create(
      files.map((file) => ({
        serviceOrderId: serviceOrderId ?? null,
        filename: file.originalname,
        storagePath: `memory://${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      })),
    );
    return this.documentRepository.save(documents);
  }

  async findAll() {
    return this.documentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) throw new NotFoundException(`document ${id} not found`);
    return document;
  }

  async findByServiceOrder(serviceOrderId: number) {
    return this.documentRepository.find({
      where: { serviceOrderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findGlobal() {
    return this.documentRepository.find({
      where: { serviceOrderId: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number) {
    const document = await this.findOne(id);
    await this.documentRepository.delete(id);

    if (document.storagePath && !document.storagePath.startsWith('memory://')) {
      try {
        await unlink(document.storagePath);
      } catch {
        // Ignore filesystem delete errors in MVP.
      }
    }

    return { deleted: true };
  }
}
