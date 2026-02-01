import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrdersRequested } from './entities/service_orders_requested.entity';
import { CreateServiceOrdersRequestedDto } from './dto/create-service_orders_requested.dto';
import { UpdateServiceOrdersRequestedDto } from './dto/update-service_orders_requested.dto';

@Injectable()
export class ServiceOrdersRequestedService {
  constructor(
    @InjectRepository(ServiceOrdersRequested)
    private readonly serviceOrdersRequestedRepository: Repository<ServiceOrdersRequested>,
  ) {}

  async create(createDto: CreateServiceOrdersRequestedDto) {
    const entity = this.serviceOrdersRequestedRepository.create(createDto);
    return this.serviceOrdersRequestedRepository.save(entity);
  }

  async findAll() {
    return this.serviceOrdersRequestedRepository.find({
      relations: [
        'center',
        'store',
        'serviceOrder',
        'order',
        'createdBy',
        'updatedBy',
      ],
    });
  }

  async findOne(id: number) {
    const entity = await this.serviceOrdersRequestedRepository.findOne({
      where: { id },
      relations: [
        'center',
        'store',
        'serviceOrder',
        'order',
        'createdBy',
        
      ],
    });
    if (!entity) throw new NotFoundException(`ServiceOrdersRequested #${id} not found`);
    return entity;
  }

  async update(id: number, updateDto: UpdateServiceOrdersRequestedDto) {
    const entity = await this.serviceOrdersRequestedRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`ServiceOrdersRequested #${id} not found`);
    const updateData: any = { ...updateDto };
    if (updateDto.centerId !== undefined) updateData.center = { id: updateDto.centerId };
    if (updateDto.storeId !== undefined) updateData.store = { id: updateDto.storeId };
    if (updateDto.serviceOrderId !== undefined) updateData.serviceOrder = { id: updateDto.serviceOrderId };
    if (updateDto.orderId !== undefined) updateData.order = { id: updateDto.orderId };
    //if (updateDto.createdBy !== undefined) updateData.createdBy = { id: updateDto.createdBy };
    //if (updateDto.updatedBy !== undefined) updateData.updatedBy = { id: updateDto.updatedBy };
    delete updateData.centerId;
    delete updateData.storeId;
    delete updateData.serviceOrderId;
    delete updateData.orderId;
    delete updateData.createdBy;
    delete updateData.updatedBy;
    await this.serviceOrdersRequestedRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.serviceOrdersRequestedRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`ServiceOrdersRequested #${id} not found`);
    return { deleted: true };
  }
}
