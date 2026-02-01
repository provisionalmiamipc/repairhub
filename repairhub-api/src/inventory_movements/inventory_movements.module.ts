import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovementsService } from './inventory_movements.service';
import { InventoryMovementsController } from './inventory_movements.controller';
import { InventoryMovement } from './entities/inventory_movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryMovement])],
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
