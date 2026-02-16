import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ReceivedPartsService } from './received-parts.service';
import { CreateReceivedPartDto } from './dto/create-received-part.dto';
import { UpdateReceivedPartDto } from './dto/update-received-part.dto';

@Controller('received-parts')
export class ReceivedPartsController {
  constructor(private readonly service: ReceivedPartsService) {}

  @Post()
  create(@Body() dto: CreateReceivedPartDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceivedPartDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
