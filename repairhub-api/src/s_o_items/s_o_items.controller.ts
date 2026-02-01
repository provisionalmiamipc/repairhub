import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SOItemsService } from './s_o_items.service';
import { CreateSOItemDto } from './dto/create-s_o_item.dto';
import { UpdateSOItemDto } from './dto/update-s_o_item.dto';

@Controller('s-o-items')
export class SOItemsController {
  constructor(private readonly sOItemsService: SOItemsService) {}

  @Post()
  create(@Body() createSOItemDto: CreateSOItemDto) {
    return this.sOItemsService.create(createSOItemDto);
  }

  @Get()
  findAll() {
    return this.sOItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sOItemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSOItemDto: UpdateSOItemDto) {
    return this.sOItemsService.update(id, updateSOItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sOItemsService.remove(id);
  }
}
