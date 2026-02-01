import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceBrandsService } from './device_brands.service';
import { DeviceBrandsController } from './device_brands.controller';
import { DeviceBrand } from './entities/device_brand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceBrand])],
  controllers: [DeviceBrandsController],
  providers: [DeviceBrandsService],
})
export class DeviceBrandsModule {}
