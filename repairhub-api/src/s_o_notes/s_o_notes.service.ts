import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SONote } from './entities/s_o_note.entity';
import { CreateSONoteDto } from './dto/create-s_o_note.dto';
import { UpdateSONoteDto } from './dto/update-s_o_note.dto';

@Injectable()
export class SONotesService {
  constructor(
    @InjectRepository(SONote)
    private readonly soNoteRepository: Repository<SONote>,
  ) {}

  async create(createSONoteDto: CreateSONoteDto) {
    const soNote = this.soNoteRepository.create({
      ...createSONoteDto,
      /*center: { id: createSONoteDto.centerId },
      store: { id: createSONoteDto.storeId },
      serviceOrder: { id: createSONoteDto.serviceOrderId },
      createdBy: { id: createSONoteDto.createdById },*/
    });
    return this.soNoteRepository.save(soNote);
  }

  async findAll() {
    return this.soNoteRepository.find({ relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async findOne(id: number) {
    return this.soNoteRepository.findOne({ where: { id }, relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async update(id: number, updateSONoteDto: UpdateSONoteDto) {
    const updateData: any = { ...updateSONoteDto };
    if ((updateSONoteDto as any).centerId) updateData.center = { id: (updateSONoteDto as any).centerId };
    if ((updateSONoteDto as any).storeId) updateData.store = { id: (updateSONoteDto as any).storeId };
    if ((updateSONoteDto as any).serviceOrderId) updateData.serviceOrder = { id: (updateSONoteDto as any).serviceOrderId };
    if ((updateSONoteDto as any).createdBy) updateData.createdBy = { id: (updateSONoteDto as any).createdBy };
    await this.soNoteRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.soNoteRepository.delete(id);
    return { deleted: true };
  }
}
