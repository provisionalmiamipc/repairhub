import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItemTypesService } from './item_types.service';
import { CreateItemTypeDto } from './dto/create-item_type.dto';
import { UpdateItemTypeDto } from './dto/update-item_type.dto';

@Controller('item-types')
export class ItemTypesController {
  constructor(private readonly itemTypesService: ItemTypesService) {}

  @Post()
  create(@Body() createItemTypeDto: CreateItemTypeDto) {
    return this.itemTypesService.create(createItemTypeDto);
  }

  @Get()
  findAll() {
    return this.itemTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.itemTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateItemTypeDto: UpdateItemTypeDto) {
    return this.itemTypesService.update(id, updateItemTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.itemTypesService.remove(id);
  }
}
