import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from './entities/inventory_movement.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory_movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory_movement.dto';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,
  ) {}

  async create(createInventoryMovementDto: CreateInventoryMovementDto) {
    // Obtener el último inventoryMovementCode
    const lastIM = await this.inventoryMovementRepository.createQueryBuilder('im')
      .orderBy('im.inventoryMovementCode', 'DESC')
      .where('im.inventoryMovementCode LIKE :prefix', { prefix: 'IM%' })
      .getOne();

    let nextNumber = 1;
    if (lastIM && lastIM.inventoryMovementCode) {
      const match = lastIM.inventoryMovementCode.match(/IM(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const inventoryMovementCode = `IM${nextNumber.toString().padStart(5, '0')}`;

    const inventoryMovement = this.inventoryMovementRepository.create({
      ...createInventoryMovementDto,
      inventoryMovementCode
    });
    return this.inventoryMovementRepository.save(inventoryMovement);
  }

  async findAll() {
    return this.inventoryMovementRepository.find({ relations: ['center', 'store', 'item', 'createdBy'] });
  }

  async findOne(id: number) {
    return this.inventoryMovementRepository.findOne({ where: { id }, relations: ['center', 'store', 'item', 'createdBy'] });
  }

  async update(id: number, updateInventoryMovementDto: UpdateInventoryMovementDto) {
    const updateData: any = { ...updateInventoryMovementDto };
    await this.inventoryMovementRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.inventoryMovementRepository.delete(id);
    return { deleted: true };
  }
}
