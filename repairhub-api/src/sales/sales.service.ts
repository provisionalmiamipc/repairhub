import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async create(createSaleDto: CreateSaleDto) {
    // Obtener el último saleCode
    const lastSale = await this.saleRepository.createQueryBuilder('sa')
      .orderBy('sa.saleCode', 'DESC')
      .where('sa.saleCode LIKE :prefix', { prefix: 'SA%' })
      .getOne();

    let nextNumber = 1;
    if (lastSale && lastSale.saleCode) {
      const match = lastSale.saleCode.match(/SA(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const saleCode = `SA${nextNumber.toString().padStart(5, '0')}`;

    const sale = this.saleRepository.create({
      ...createSaleDto,
      center: { id: createSaleDto.centerId },
      store: { id: createSaleDto.storeId },
      employee: { id: createSaleDto.createdById },
      //updatedBy: { id: createSaleDto.updatedBy },
      customer: createSaleDto.customerId ? { id: createSaleDto.customerId } : undefined,
      paymentType: { id: createSaleDto.paymentTypeId },
      saleCode
    });
    return this.saleRepository.save(sale);
  }

  async findAll() {
    return this.saleRepository.find({ relations: ['center', 'store', 'createdBy', 'updatedBy', 'customer', 'paymentType', 'refunds'] });
  }

  async findOne(id: number) {
    return this.saleRepository.findOne({
       where: { id }, 
       relations: ['center', 'store', 'createdById', 'customer', 'paymentType'] });
  }

  async update(id: number, updateSaleDto: UpdateSaleDto) {
    const updateData: any = { ...updateSaleDto };
    if ((updateSaleDto as any).centerId) updateData.center = { id: (updateSaleDto as any).centerId };
    if ((updateSaleDto as any).storeId) updateData.store = { id: (updateSaleDto as any).storeId };
    if ((updateSaleDto as any).createdBy) updateData.createdBy = { id: (updateSaleDto as any).createdBy };
    //if ((updateSaleDto as any).updatedBy) updateData.updatedBy = { id: (updateSaleDto as any).updatedBy };
    if ((updateSaleDto as any).customerId) updateData.customer = { id: (updateSaleDto as any).customerId };
    if ((updateSaleDto as any).paymentTypeId) updateData.paymentType = { id: (updateSaleDto as any).paymentTypeId };
  await this.saleRepository.update(id, updateData);
  return this.findOne(id);
  }

  async remove(id: number) {
    await this.saleRepository.delete(id);
    return { deleted: true };
  }
}
