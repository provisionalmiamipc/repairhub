import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto) {
    // Obtener el último itemCode
    const lastItem = await this.itemRepository.createQueryBuilder('it')
      .orderBy('it.itemCode', 'DESC')
      .where('it.itemCode LIKE :prefix', { prefix: 'IT%' })
      .getOne();

    let nextNumber = 1;
    if (lastItem && lastItem.itemCode) {
      const match = lastItem.itemCode.match(/IT(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const itemCode = `IT${nextNumber.toString().padStart(5, '0')}`;

    const item = this.itemRepository.create({
      ...createItemDto,
      itemCode,
    });
    return this.itemRepository.save(item);
  }

  async findAll() {
    return this.itemRepository.find({ relations: ['center', 'store', 'itemType'] });
  }

  async findOne(id: number) {
    return this.itemRepository.findOne({ where: { id }, relations: ['center', 'store', 'itemType'] });
  }

  async update(id: number, updateItemDto: UpdateItemDto) {
    const updateData: any = { ...updateItemDto };
    await this.itemRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.itemRepository.delete(id);
    return { deleted: true };
  }
}
