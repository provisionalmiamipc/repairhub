import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './entities/media-asset.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { ImageProcessorService } from './image-processor.service';
import { GoogleStorageService } from './google-storage.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset, ServiceOrder])],
  controllers: [MediaController],
  providers: [MediaService, ImageProcessorService, GoogleStorageService],
  exports: [MediaService],
})
export class MediaModule {}
