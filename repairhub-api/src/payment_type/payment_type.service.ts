import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentType } from './entities/payment_type.entity';
import { CreatePaymentTypeDto } from './dto/create-payment_type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment_type.dto';

@Injectable()
export class PaymentTypeService {
  constructor(
    @InjectRepository(PaymentType)
    private readonly paymentTypeRepository: Repository<PaymentType>,
  ) {}

  async create(createPaymentTypeDto: CreatePaymentTypeDto) {
    const paymentType = this.paymentTypeRepository.create({
      ...createPaymentTypeDto,
      center: { id: createPaymentTypeDto.centerId },
      store: { id: createPaymentTypeDto.storeId },
    });
    return this.paymentTypeRepository.save(paymentType);
  }

  async findAll() {
    return this.paymentTypeRepository.find({ relations: ['center', 'store'] });
  }

  async findOne(id: number) {
    return this.paymentTypeRepository.findOne({ where: { id }, relations: ['center', 'store'] });
  }

  async update(id: number, updatePaymentTypeDto: UpdatePaymentTypeDto) {
    const updateData: any = { ...updatePaymentTypeDto };
    if ((updatePaymentTypeDto as any).centerId) updateData.center = { id: (updatePaymentTypeDto as any).centerId };
    if ((updatePaymentTypeDto as any).storeId) updateData.store = { id: (updatePaymentTypeDto as any).storeId };
    await this.paymentTypeRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.paymentTypeRepository.delete(id);
    return { deleted: true };
  }
}
