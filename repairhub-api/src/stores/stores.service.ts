import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { promises } from 'dns';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(createDto: CreateStoreDto) {
    // Obtener el último storeCode
    const lastStore = await this.storeRepository.createQueryBuilder('st')
      .orderBy('st.storeCode', 'DESC')
      .where('st.storeCode LIKE :prefix', { prefix: 'ST%' })
      .getOne();

    let nextNumber = 1;
    if (lastStore && lastStore.storeCode) {
      const match = lastStore.storeCode.match(/ST(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const storeCode = `ST${nextNumber.toString().padStart(5, '0')}`;

    const entity = this.storeRepository.create({ ...createDto, storeCode });
    return this.storeRepository.save(entity);
  }

  async findAll() {
    return this.storeRepository.find();
  }

  async findOne(id: number) {
    const entity = await this.storeRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Store #${id} not found`);
    return entity;
  }

  async update(id: number, updateDto: UpdateStoreDto): Promise<Store> {
    const entity = await this.storeRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Store #${id} not found`);
    await this.storeRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.storeRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Store #${id} not found`);
    return { deleted: true };
  }
}
