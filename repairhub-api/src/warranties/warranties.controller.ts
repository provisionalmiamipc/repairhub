import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateWarrantyOrderDto } from './dto/create-warranty-order.dto';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { VoidWarrantyDto } from './dto/void-warranty.dto';
import { WarrantiesService } from './warranties.service';

@Controller('warranties')
export class WarrantiesController {
  constructor(private readonly service: WarrantiesService) {}

  @Post()
  create(@Body() dto: CreateWarrantyDto) {
    return this.service.create(dto);
  }

  @Post('from-service-order/:serviceOrderId')
  createFromServiceOrder(
    @Param('serviceOrderId', ParseIntPipe) serviceOrderId: number,
    @Body('createdById') createdById?: number,
  ) {
    return this.service.createFromServiceOrder(serviceOrderId, createdById);
  }

  @Get()
  findAll(@Query('serviceOrderId') serviceOrderId?: string) {
    const id = serviceOrderId ? Number(serviceOrderId) : undefined;
    if (id && Number.isFinite(id)) return this.service.findByServiceOrder(id);
    return this.service.findAll();
  }

  @Get('service-order/:serviceOrderId')
  findByServiceOrder(@Param('serviceOrderId', ParseIntPipe) serviceOrderId: number) {
    return this.service.findByServiceOrder(serviceOrderId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWarrantyDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/void')
  void(@Param('id', ParseIntPipe) id: number, @Body() dto: VoidWarrantyDto) {
    return this.service.void(id, dto);
  }

  @Post(':id/service-order')
  createWarrantyOrder(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateWarrantyOrderDto) {
    return this.service.createWarrantyOrder(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
