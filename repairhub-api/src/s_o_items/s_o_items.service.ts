import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SOItem } from './entities/s_o_item.entity';
import { CreateSOItemDto } from './dto/create-s_o_item.dto';
import { UpdateSOItemDto } from './dto/update-s_o_item.dto';

@Injectable()
export class SOItemsService {
  constructor(
    @InjectRepository(SOItem)
    private readonly soItemRepository: Repository<SOItem>,
  ) {}

  async create(createSOItemDto: CreateSOItemDto) {
    const soItem = this.soItemRepository.create({
      centerId: createSOItemDto.centerId,
      storeId: createSOItemDto.storeId,
      serviceOrderId: createSOItemDto.serviceOrderId,
      itemId: createSOItemDto.itemId,
      quantity: createSOItemDto.quantity ?? 1,
      cost: createSOItemDto.cost ?? 0,
      price: createSOItemDto.price ?? 0,
      discount: createSOItemDto.discount ?? 0,
      note: createSOItemDto.note,
      createdById: createSOItemDto.createdById ?? undefined,
    });
    return this.soItemRepository.save(soItem);
  }

  async findAll() {
    return this.soItemRepository.find({ relations: ['center', 'store', 'serviceOrder', 'item', 'employee'] });
  }

  async findOne(id: number) {
    return this.soItemRepository.findOne({ where: { id }, relations: ['center', 'store', 'serviceOrder', 'item', 'employee'] });
  }

  async update(id: number, updateSOItemDto: UpdateSOItemDto) {
    const updateData: any = { ...updateSOItemDto };
    if ((updateSOItemDto as any).centerId) updateData.center = { id: (updateSOItemDto as any).centerId };
    if ((updateSOItemDto as any).storeId) updateData.store = { id: (updateSOItemDto as any).storeId };
    if ((updateSOItemDto as any).serviceOrderId) updateData.serviceOrder = { id: (updateSOItemDto as any).serviceOrderId };
    if ((updateSOItemDto as any).itemId) updateData.item = { id: (updateSOItemDto as any).itemId };
    if ((updateSOItemDto as any).createdById) updateData.createdById = (updateSOItemDto as any).createdById;
    if ((updateSOItemDto as any).updatedBy) updateData.updatedBy = { id: (updateSOItemDto as any).updatedBy };
    await this.soItemRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.soItemRepository.delete(id);
    return { deleted: true };
  }
}
