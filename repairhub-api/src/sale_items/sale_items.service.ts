import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleItem } from './entities/sale_item.entity';
import { CreateSaleItemDto } from './dto/create-sale_item.dto';
import { UpdateSaleItemDto } from './dto/update-sale_item.dto';

@Injectable()
export class SaleItemsService {
  constructor(
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
  ) {}

  async create(createSaleItemDto: CreateSaleItemDto) {
    const saleItem = this.saleItemRepository.create(createSaleItemDto);//({
      //...createSaleItemDto,
      //center: { id: (createSaleItemDto as any).centerId },
      //store: { id: (createSaleItemDto as any).storeId },
     // sale: { id: (createSaleItemDto as any).saleId },
      //item: { id: (createSaleItemDto as any).itemId },
      //createdBy: { id: (createSaleItemDto as any).createdBy },
      //updatedBy: { id: (createSaleItemDto as any).updatedBy },
      
   // });
    return this.saleItemRepository.save(saleItem);
  }

  async findAll() {
    return this.saleItemRepository.find({ relations: ['center', 'store', 'sale', 'item', 'createdBy', 'updatedBy'] });
  }

  async findOne(id: number) {
    return this.saleItemRepository.findOne({ where: { id }, relations: ['center', 'store', 'sale', 'item', 'createdBy', 'updatedBy'] });
  }

  async update(id: number, updateSaleItemDto: UpdateSaleItemDto) {
    const updateData: any = { ...updateSaleItemDto };
    if ((updateSaleItemDto as any).centerId) updateData.center = { id: (updateSaleItemDto as any).centerId };
    if ((updateSaleItemDto as any).storeId) updateData.store = { id: (updateSaleItemDto as any).storeId };
    if ((updateSaleItemDto as any).saleId) updateData.sale = { id: (updateSaleItemDto as any).saleId };
    if ((updateSaleItemDto as any).itemId) updateData.item = { id: (updateSaleItemDto as any).itemId };
    if ((updateSaleItemDto as any).createdBy) updateData.createdBy = { id: (updateSaleItemDto as any).createdBy };
    if ((updateSaleItemDto as any).updatedBy) updateData.updatedBy = { id: (updateSaleItemDto as any).updatedBy };
    await this.saleItemRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.saleItemRepository.delete(id);
    return { deleted: true };
  }
}
