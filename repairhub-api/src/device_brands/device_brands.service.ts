import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceBrand } from './entities/device_brand.entity';
import { CreateDeviceBrandDto } from './dto/create-device_brand.dto';
import { UpdateDeviceBrandDto } from './dto/update-device_brand.dto';

@Injectable()
export class DeviceBrandsService {
  constructor(
    @InjectRepository(DeviceBrand)
    private readonly deviceBrandRepository: Repository<DeviceBrand>,
  ) {}

  async create(createDeviceBrandDto: CreateDeviceBrandDto) {
    const deviceBrand = this.deviceBrandRepository.create({
      ...createDeviceBrandDto,
      center: { id: createDeviceBrandDto.centerId },
      store: { id: createDeviceBrandDto.storeId },
    });
    return this.deviceBrandRepository.save(deviceBrand);
  }

  async findAll() {
    return this.deviceBrandRepository.find({ relations: ['center', 'store'] });
  }

  async findOne(id: number) {
    return this.deviceBrandRepository.findOne({ where: { id }, relations: ['center', 'store'] });
  }

  async update(id: number, updateDeviceBrandDto: UpdateDeviceBrandDto) {
    const updateData: any = { ...updateDeviceBrandDto };
    if ((updateDeviceBrandDto as any).centerId) updateData.center = { id: (updateDeviceBrandDto as any).centerId };
    if ((updateDeviceBrandDto as any).storeId) updateData.store = { id: (updateDeviceBrandDto as any).storeId };
  await this.deviceBrandRepository.update(id, updateData);
  return this.findOne(id);
  }

  async remove(id: number) {
    await this.deviceBrandRepository.delete(id);
    return { deleted: true };
  }
}
