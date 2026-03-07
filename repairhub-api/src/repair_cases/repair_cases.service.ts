import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairCase } from './entities/repair_case.entity';
import { CreateRepairCaseDto } from './dto/create-repair_case.dto';
import { UpdateRepairCaseDto } from './dto/update-repair_case.dto';

@Injectable()
export class RepairCasesService {
  constructor(
    @InjectRepository(RepairCase)
    private readonly repairCaseRepository: Repository<RepairCase>,
  ) {}

  async create(createRepairCaseDto: CreateRepairCaseDto) {
    const repairCase = this.repairCaseRepository.create({
      ...createRepairCaseDto,
      source: 'internal',
    });
    return this.repairCaseRepository.save(repairCase);
  }

  async findAll() {
    return this.repairCaseRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const repairCase = await this.repairCaseRepository.findOne({ where: { id } });
    if (!repairCase) throw new NotFoundException(`repair_case ${id} no encontrado`);
    return repairCase;
  }

  async update(id: number, updateRepairCaseDto: UpdateRepairCaseDto) {
    await this.repairCaseRepository.update(id, updateRepairCaseDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repairCaseRepository.delete(id);
    return { deleted: true };
  }
}
