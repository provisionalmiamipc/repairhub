import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemType } from './entities/item_type.entity';
import { CreateItemTypeDto } from './dto/create-item_type.dto';
import { UpdateItemTypeDto } from './dto/update-item_type.dto';

@Injectable()
export class ItemTypesService {
  constructor(
    @InjectRepository(ItemType)
    private readonly itemTypeRepository: Repository<ItemType>,
  ) {}

  async create(createItemTypeDto: CreateItemTypeDto) {
    const itemType = this.itemTypeRepository.create({
      ...createItemTypeDto,
      center: { id: createItemTypeDto.centerId },
      store: { id: createItemTypeDto.storeId },
    });
    return this.itemTypeRepository.save(itemType);
  }

  async findAll() {
    return this.itemTypeRepository.find({ relations: ['center', 'store', 'items'] });
  }

  async findOne(id: number) {
    return this.itemTypeRepository.findOne({ where: { id }, relations: ['center', 'store', 'items'] });
  }

  async update(id: number, updateItemTypeDto: UpdateItemTypeDto) {
    const updateData: any = { ...updateItemTypeDto };
    if ((updateItemTypeDto as any).centerId) updateData.center = { id: (updateItemTypeDto as any).centerId };
    if ((updateItemTypeDto as any).storeId) updateData.store = { id: (updateItemTypeDto as any).storeId };
    await this.itemTypeRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.itemTypeRepository.delete(id);
    return { deleted: true };
  }
}
