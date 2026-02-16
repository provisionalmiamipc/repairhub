import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceivedPart } from './entities/received-part.entity';
import { CreateReceivedPartDto } from './dto/create-received-part.dto';
import { UpdateReceivedPartDto } from './dto/update-received-part.dto';

@Injectable()
export class ReceivedPartsService {
  constructor(
    @InjectRepository(ReceivedPart)
    private repo: Repository<ReceivedPart>,
  ) {}

  create(dto: CreateReceivedPartDto) {
    const entity = this.repo.create(dto as any);
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Received part not found');
    return r;
  }

  async update(id: number, dto: UpdateReceivedPartDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
