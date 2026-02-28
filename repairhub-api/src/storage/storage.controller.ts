// storage/storage.controller.ts
import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors,
  Delete,
  Param,
  Get,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB máximo
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.storageService.uploadFile(file);
  }

  @Delete('delete/:bucket/:filename')
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
  ) {
    return this.storageService.deleteFile(filename, bucket);
  }

  @Get('list/:bucket')
  async listFiles(@Param('bucket') bucket: string) {
    return this.storageService.listFiles(bucket);
  }

  @Get('url/:bucket/:filename')
  async getFileUrl(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
  ) {
    const url = await this.storageService.getFileUrl(filename, bucket);
    return { url };
  }
}