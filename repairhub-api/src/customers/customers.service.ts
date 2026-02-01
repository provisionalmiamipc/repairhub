import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Gender } from '../common/enums/gender.enum';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Obtener el último customerCode
    const lastCustomer = await this.customerRepository.createQueryBuilder('cu')
      .orderBy('cu.customerCode', 'DESC')
      .where('cu.customerCode LIKE :prefix', { prefix: 'CU%' })
      .getOne();

    let nextNumber = 1;
    if (lastCustomer && lastCustomer.customerCode) {
      const match = lastCustomer.customerCode.match(/CU(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const customerCode = `CU${nextNumber.toString().padStart(5, '0')}`;

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      gender: createCustomerDto.gender === 'Male' ? Gender.MALE : Gender.FEMALE,
      center: { id: createCustomerDto.centerId },
      store: { id: createCustomerDto.storeId },
      customerCode
    });
    return this.customerRepository.save(customer);
  }

  async findAll() {
    return this.customerRepository.find({ relations: ['center', 'store'] });
  }

  async findOne(id: number) {
    return this.customerRepository.findOne({ where: { id }, relations: ['center', 'store'] });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const updateData: any = { ...updateCustomerDto };
    await this.customerRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.customerRepository.delete(id);
    return { deleted: true };
  }
}
