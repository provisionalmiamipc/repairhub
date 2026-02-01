import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairStatus } from './entities/repair_status.entity';
import { CreateRepairStatusDto } from './dto/create-repair_status.dto';
import { UpdateRepairStatusDto } from './dto/update-repair_status.dto';

@Injectable()
export class RepairStatusService {
  constructor(
    @InjectRepository(RepairStatus)
    private readonly repairStatusRepository: Repository<RepairStatus>,
  ) {}

  async create(createRepairStatusDto: CreateRepairStatusDto) {
    const repairStatus = this.repairStatusRepository.create({
      ...createRepairStatusDto,
      /*center: { id: createRepairStatusDto.centerId },
      store: { id: createRepairStatusDto.storeId },
      serviceOrder: { id: createRepairStatusDto.serviceOrderId },
      employee: { id: createRepairStatusDto.createdById },*/
    });
    return this.repairStatusRepository.save(repairStatus);
  }

  async findAll() {
    return this.repairStatusRepository.find({ relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async findOne(id: number) {
    return this.repairStatusRepository.findOne({ where: { id }, relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async update(id: number, updateRepairStatusDto: UpdateRepairStatusDto) {
    const updateData: any = { ...updateRepairStatusDto };
    if ((updateRepairStatusDto as any).centerId) updateData.center = { id: (updateRepairStatusDto as any).centerId };
    if ((updateRepairStatusDto as any).storeId) updateData.store = { id: (updateRepairStatusDto as any).storeId };
    if ((updateRepairStatusDto as any).serviceOrderId) updateData.serviceOrder = { id: (updateRepairStatusDto as any).serviceOrderId };
    if ((updateRepairStatusDto as any).createdBy) updateData.createdBy = { id: (updateRepairStatusDto as any).createdBy };
    await this.repairStatusRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repairStatusRepository.delete(id);
    return { deleted: true };
  }
}
