import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from './entities/service_type.entity';
import { CreateServiceTypeDto } from './dto/create-service_type.dto';
import { UpdateServiceTypeDto } from './dto/update-service_type.dto';

@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async create(createDto: CreateServiceTypeDto) {
    const entity = this.serviceTypeRepository.create(createDto);
    return this.serviceTypeRepository.save(entity);
  }

  async findAll() {
    return this.serviceTypeRepository.find({
      relations: ['center', 'store', 'appointments'],
    });
  }


  async findOne(id: string | number) {
    const entity = await this.serviceTypeRepository.findOne({
      where: { id: Number(id) },
      relations: ['center', 'store', 'appointments'],
    });
    if (!entity) throw new NotFoundException(`ServiceType #${id} not found`);
    return entity;
  }


  async update(id: string | number, updateDto: UpdateServiceTypeDto) {
    const entity = await this.serviceTypeRepository.findOne({ where: { id: Number(id) } });
    if (!entity) throw new NotFoundException(`ServiceType #${id} not found`);
    const updateData: any = { ...updateDto };
    if (updateDto.centerId !== undefined) updateData.center = { id: updateDto.centerId };
    if (updateDto.storeId !== undefined) updateData.store = { id: updateDto.storeId };
    delete updateData.centerid;
    delete updateData.storeid;
    await this.serviceTypeRepository.update(Number(id), updateData);
    return this.findOne(id);
  }

  async remove(id: string | number) {
    const result = await this.serviceTypeRepository.delete(Number(id));
    if (result.affected === 0) throw new NotFoundException(`ServiceType #${id} not found`);
    return { deleted: true };
  }
}
