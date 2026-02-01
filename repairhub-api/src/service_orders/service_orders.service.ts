import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from './entities/service_order.entity';
import { CreateServiceOrderDto } from './dto/create-service_order.dto';
import { UpdateServiceOrderDto } from './dto/update-service_order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
  ) {}

  async create(createDto: CreateServiceOrderDto) {
    // Obtener el último orderCode
    const lastOrder = await this.serviceOrderRepository.createQueryBuilder('so')
      .orderBy('so.orderCode', 'DESC')
      .where('so.orderCode LIKE :prefix', { prefix: 'SO%' })
      .getOne();

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderCode) {
      const match = lastOrder.orderCode.match(/SO(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const orderCode = `SO${nextNumber.toString().padStart(5, '0')}`;

    const entity = this.serviceOrderRepository.create({ ...createDto, orderCode });
    return this.serviceOrderRepository.save(entity);
  }

  async findAll() {
    return this.serviceOrderRepository.find({
      relations: [
        'center',
        'store',
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        
      ],
    });
  }

  async findOne(id: number) {
    const entity = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: [
        'center',
        'store',
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
      ],
    });
    if (!entity) throw new NotFoundException(`ServiceOrder #${id} not found`);
    return entity;
  }

  async update(id: number, updateDto: UpdateServiceOrderDto) {
    const entity = await this.serviceOrderRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`ServiceOrder #${id} not found`);
    const updateData: any = { ...updateDto };
    if (updateDto.centerId !== undefined) updateData.center = { id: updateDto.centerId };
    if (updateDto.storeId !== undefined) updateData.store = { id: updateDto.storeId };
    if (updateDto.customerId !== undefined) updateData.customer = { id: updateDto.customerId };
    if (updateDto.deviceId !== undefined) updateData.device = { id: updateDto.deviceId };
    if (updateDto.deviceBrandId !== undefined) updateData.deviceBrand = { id: updateDto.deviceBrandId };
    delete updateData.centerId;
    delete updateData.storeId;
    delete updateData.customerId;
    delete updateData.deviceId;
    delete updateData.deviceBrandId;
    await this.serviceOrderRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.serviceOrderRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`ServiceOrder #${id} not found`);
    return { deleted: true };
  }
}
