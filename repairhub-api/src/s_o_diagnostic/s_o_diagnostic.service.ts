import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SODiagnostic } from './entities/s_o_diagnostic.entity';
import { CreateSODiagnosticDto } from './dto/create-s_o_diagnostic.dto';
import { UpdateSODiagnosticDto } from './dto/update-s_o_diagnostic.dto';

@Injectable()
export class SODiagnosticService {
  constructor(
    @InjectRepository(SODiagnostic)
    private readonly sODiagnosticRepository: Repository<SODiagnostic>,
  ) {}

  async create(createSODiagnosticDto: CreateSODiagnosticDto) {
    const sODiagnostic = this.sODiagnosticRepository.create({
      ...createSODiagnosticDto,
      /*center: { id: createSODiagnosticDto.centerId },
      store: { id: createSODiagnosticDto.storeId },
      serviceOrder: { id: createSODiagnosticDto.serviceOrderId },
      employee: { id: createSODiagnosticDto.createdById },*/
    });
    return this.sODiagnosticRepository.save(sODiagnostic);
  }

  async findAll() {
    return this.sODiagnosticRepository.find({ relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async findOne(id: number) {
    return this.sODiagnosticRepository.findOne({ where: { id }, relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async update(id: number, updateSODiagnosticDto: UpdateSODiagnosticDto) {
    const updateData: any = { ...updateSODiagnosticDto };
    if ((updateSODiagnosticDto as any).centerId) updateData.center = { id: (updateSODiagnosticDto as any).centerId };
    if ((updateSODiagnosticDto as any).storeId) updateData.store = { id: (updateSODiagnosticDto as any).storeId };
    if ((updateSODiagnosticDto as any).serviceOrderId) updateData.serviceOrder = { id: (updateSODiagnosticDto as any).serviceOrderId };
    if ((updateSODiagnosticDto as any).createdBy) updateData.createdBy = { id: (updateSODiagnosticDto as any).createdBy };
    await this.sODiagnosticRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.sODiagnosticRepository.delete(id);
    return { deleted: true };
  }
}
