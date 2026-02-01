import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InventoryMovementsService } from './inventory_movements.service';
import { CreateInventoryMovementDto } from './dto/create-inventory_movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory_movement.dto';

@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(private readonly inventoryMovementsService: InventoryMovementsService) {}

  @Post()
  create(@Body() createInventoryMovementDto: CreateInventoryMovementDto) {
    return this.inventoryMovementsService.create(createInventoryMovementDto);
  }

  @Get()
  findAll() {
    return this.inventoryMovementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.inventoryMovementsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateInventoryMovementDto: UpdateInventoryMovementDto) {
    return this.inventoryMovementsService.update(id, updateInventoryMovementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.inventoryMovementsService.remove(id);
  }
}
