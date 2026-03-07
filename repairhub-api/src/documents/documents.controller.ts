import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { DocumentsService } from './documents.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

const DOC_UPLOAD_DIR = join(process.cwd(), 'uploads', 'pdfs');
mkdirSync(DOC_UPLOAD_DIR, { recursive: true });

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        serviceOrderId: { type: 'string', nullable: true },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document created' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, DOC_UPLOAD_DIR),
        filename: (_req, file, cb) => {
          const safeName = file.originalname
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '');
          const extension = extname(safeName).toLowerCase();
          const baseName = safeName.replace(new RegExp(`${extension}$`), '');
          cb(null, `${Date.now()}-${baseName}${extension}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('serviceOrderId') serviceOrderId?: string,
  ) {
    if (!file) throw new BadRequestException('You must send a file in the "file" field');

    const parsedServiceOrderId = serviceOrderId ? Number(serviceOrderId) : null;
    if (serviceOrderId && Number.isNaN(parsedServiceOrderId)) {
      throw new BadRequestException('serviceOrderId must be numeric');
    }

    return this.documentsService.createFromUpload(file, parsedServiceOrderId);
  }

  @Post('upload-many')
  @ApiOperation({ summary: 'Upload multiple documents' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        serviceOrderId: { type: 'string', nullable: true },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 201, description: 'Documents created' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, DOC_UPLOAD_DIR),
        filename: (_req, file, cb) => {
          const safeName = file.originalname
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '');
          const extension = extname(safeName).toLowerCase();
          const baseName = safeName.replace(new RegExp(`${extension}$`), '');
          cb(null, `${Date.now()}-${baseName}${extension}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('serviceOrderId') serviceOrderId?: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('You must send at least one file in the "files" field');
    }

    const parsedServiceOrderId = serviceOrderId ? Number(serviceOrderId) : null;
    if (serviceOrderId && Number.isNaN(parsedServiceOrderId)) {
      throw new BadRequestException('serviceOrderId must be numeric');
    }

    return this.documentsService.createManyFromUpload(files, parsedServiceOrderId);
  }

  @Get()
  @ApiOperation({ summary: 'List all documents' })
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('global')
  @ApiOperation({ summary: 'List global documents (without serviceOrder)' })
  findGlobal() {
    return this.documentsService.findGlobal();
  }

  @Get('service-order/:id')
  @ApiOperation({ summary: 'List documents by service order' })
  findByServiceOrder(@Param('id') id: string) {
    return this.documentsService.findByServiceOrder(Number(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one document by id' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document by id' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(Number(id));
  }
}
