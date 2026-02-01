import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Center } from './entities/center.entity';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Injectable()
export class CentersService {
  constructor(
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
  ) {}

  async create(createCenterDto: CreateCenterDto): Promise<Center>  {
    // Obtener el último centerCode
    const lastCenter = await this.centerRepository.createQueryBuilder('ce')
      .orderBy('ce.centerCode', 'DESC')
      .where('ce.centerCode LIKE :prefix', { prefix: 'CE%' })
      .getOne();

    let nextNumber = 1;
    if (lastCenter && lastCenter.centerCode) {
      const match = lastCenter.centerCode.match(/CE(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const centerCode = `CE${nextNumber.toString().padStart(5, '0')}`;

    const center = this.centerRepository.create({ ...createCenterDto, centerCode });
    return this.centerRepository.save(center);
  }

  async findAll() {
    return this.centerRepository.find({ relations: ['stores', 'employees'] });
  }

  async findOne(id: number) {
    return this.centerRepository.findOne({ where: { id }, relations: ['stores', 'employees'] });
  }

  async update(id: number, updateCenterDto: UpdateCenterDto) {    
    await this.centerRepository.update(id, updateCenterDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.centerRepository.delete(id);
    return { deleted: true };
  }
}
