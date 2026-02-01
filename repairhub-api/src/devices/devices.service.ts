import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const device = this.deviceRepository.create({
      ...createDeviceDto,
      center: { id: createDeviceDto.centerId },
      store: { id: createDeviceDto.storeId },
    });
    return this.deviceRepository.save(device);
  }

  async findAll() {
    return this.deviceRepository.find({ relations: ['center', 'store', 'appointments'] });
  }

  async findOne(id: number) {
    return this.deviceRepository.findOne({ where: { id }, relations: ['center', 'store', 'appointments'] });
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto) {
    const updateData: any = { ...updateDeviceDto };
    if ((updateDeviceDto as any).centerId) updateData.center = { id: (updateDeviceDto as any).centerId };
    if ((updateDeviceDto as any).storeId) updateData.store = { id: (updateDeviceDto as any).storeId };
    await this.deviceRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.deviceRepository.delete(id);
    return { deleted: true };
  }
}
