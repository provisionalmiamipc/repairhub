import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // Obtener el último orderCode
    const lastOrder = await this.orderRepository.createQueryBuilder('or')
      .orderBy('or.orderCode', 'DESC')
      .where('or.orderCode LIKE :prefix', { prefix: 'OR%' })
      .getOne();

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderCode) {
      const match = lastOrder.orderCode.match(/OR(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const orderCode = `OR${nextNumber.toString().padStart(5, '0')}`;

    const order = this.orderRepository.create({
      ...createOrderDto,
      orderCode,
    });
    return this.orderRepository.save(order);
  }

  async findAll() {
    return this.orderRepository.find({ relations: ['center', 'store', 'customer', 'paymentType', 'createdBy', 'updatedBy', 'items'] });
  }

  async findOne(id: number) {
    return this.orderRepository.findOne({ where: { id }, relations: ['center', 'store', 'customer', 'paymentType', 'createdBy', 'updatedBy', 'items'] });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const updateData: any = { ...updateOrderDto };
    await this.orderRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.orderRepository.delete(id);
    return { deleted: true };
  }
}
