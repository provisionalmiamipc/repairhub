import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceOrdersRequestedService } from './service_orders_requested.service';
import { CreateServiceOrdersRequestedDto } from './dto/create-service_orders_requested.dto';
import { UpdateServiceOrdersRequestedDto } from './dto/update-service_orders_requested.dto';

@Controller('service-orders-requested')
export class ServiceOrdersRequestedController {
  constructor(private readonly serviceOrdersRequestedService: ServiceOrdersRequestedService) {}

  @Post()
  create(@Body() createServiceOrdersRequestedDto: CreateServiceOrdersRequestedDto) {
    return this.serviceOrdersRequestedService.create(createServiceOrdersRequestedDto);
  }

  @Get()
  findAll() {
    return this.serviceOrdersRequestedService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.serviceOrdersRequestedService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateServiceOrdersRequestedDto: UpdateServiceOrdersRequestedDto) {
    return this.serviceOrdersRequestedService.update(id, updateServiceOrdersRequestedDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.serviceOrdersRequestedService.remove(id);
  }
}
