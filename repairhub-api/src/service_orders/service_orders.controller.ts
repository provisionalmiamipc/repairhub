import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { ServiceOrdersService } from './service_orders.service';
import { CreateServiceOrderDto } from './dto/create-service_order.dto';
import { UpdateServiceOrderDto } from './dto/update-service_order.dto';

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  create(@Body() createServiceOrderDto: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(createServiceOrderDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.serviceOrdersService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.serviceOrdersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateServiceOrderDto: UpdateServiceOrderDto) {
    return this.serviceOrdersService.update(id, updateServiceOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.serviceOrdersService.remove(id);
  }

  @Post(':id/resend-email')
  async resendEmail(@Param('id') id: number, @Res() res: Response) {
    await this.serviceOrdersService.resendEmail(Number(id));
    return res.json({ ok: true, message: 'Resend requested' });
  }
}
