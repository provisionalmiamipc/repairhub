import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersItem } from './entities/orders_item.entity';
import { CreateOrdersItemDto } from './dto/create-orders_item.dto';
import { UpdateOrdersItemDto } from './dto/update-orders_item.dto';

@Injectable()
export class OrdersItemService {
  constructor(
    @InjectRepository(OrdersItem)
    private readonly ordersItemRepository: Repository<OrdersItem>,
  ) {}

  async create(createOrdersItemDto: CreateOrdersItemDto) {
    const ordersItem = this.ordersItemRepository.create({
      ...createOrdersItemDto,
      /*center: { id: createOrdersItemDto.centerId },
      store: { id: createOrdersItemDto.storeId },
      order: { id: createOrdersItemDto.orderId },
      item: { id: createOrdersItemDto.itemId },
      createdBy: { id: createOrdersItemDto.createdById },*/
      //updatedBy: { id: createOrdersItemDto.updatedBy },
    });
    return this.ordersItemRepository.save(ordersItem);
  }

  async findAll() {
    return this.ordersItemRepository.find({ relations: ['center', 'store', 'order', 'item', 'createdBy', 'updatedBy'] });
  }

  async findOne(id: number) {
    return this.ordersItemRepository.findOne({ where: { id }, relations: ['center', 'store', 'order', 'item', 'createdBy', 'updatedBy'] });
  }

  async update(id: number, updateOrdersItemDto: UpdateOrdersItemDto) {
    const updateData: any = { ...updateOrdersItemDto };
    if ((updateOrdersItemDto as any).centerId) updateData.center = { id: (updateOrdersItemDto as any).centerId };
    if ((updateOrdersItemDto as any).storeId) updateData.store = { id: (updateOrdersItemDto as any).storeId };
    if ((updateOrdersItemDto as any).orderId) updateData.order = { id: (updateOrdersItemDto as any).orderId };
    if ((updateOrdersItemDto as any).itemId) updateData.item = { id: (updateOrdersItemDto as any).itemId };
    if ((updateOrdersItemDto as any).createdBy) updateData.createdBy = { id: (updateOrdersItemDto as any).createdBy };
    if ((updateOrdersItemDto as any).updatedBy) updateData.updatedBy = { id: (updateOrdersItemDto as any).updatedBy };
    await this.ordersItemRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.ordersItemRepository.delete(id);
    return { deleted: true };
  }
}
