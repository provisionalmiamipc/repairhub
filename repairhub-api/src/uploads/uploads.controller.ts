import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'items');

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function filenameFactory(req: any, file: any, cb: Function) {
  // sanitize original name and create unique filename
  const original = file.originalname || 'file';
  const ext = extname(original).toLowerCase() || '.jpg';
  const base = original.replace(/\.[^.]+$/, '').toString().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  let name = `${base}${ext}`;
  let i = 1;
  const { existsSync } = require('fs');
  while (existsSync(join(UPLOAD_DIR, name))) {
    name = `${base}-${i}${ext}`;
    i++;
  }
  cb(null, name);
}

@Controller('upload')
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        try {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        } catch (e) {
          cb(e, UPLOAD_DIR);
        }
      },
      filename: (req, file, cb) => filenameFactory(req, file, cb),
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  }))
  async upload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Return only the filename (as required)
    return { filename: file.filename, path: `/uploads/items/${file.filename}` };
  }

  @Delete(':filename')
  async remove(@Param('filename') filename: string) {
    const { unlinkSync, existsSync } = require('fs');
    const filePath = join(UPLOAD_DIR, filename);
    if (!existsSync(filePath)) {
      return { deleted: false, reason: 'not_found' };
    }
    try {
      unlinkSync(filePath);
      return { deleted: true };
    } catch (e) {
      return { deleted: false, reason: e.message };
    }
  }
}
