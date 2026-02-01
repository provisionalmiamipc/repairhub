import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersItemService } from './orders_item.service';
import { CreateOrdersItemDto } from './dto/create-orders_item.dto';
import { UpdateOrdersItemDto } from './dto/update-orders_item.dto';

@Controller('orders-item')
export class OrdersItemController {
  constructor(private readonly ordersItemService: OrdersItemService) {}

  @Post()
  create(@Body() createOrdersItemDto: CreateOrdersItemDto) {
    return this.ordersItemService.create(createOrdersItemDto);
  }

  @Get()
  findAll() {
    return this.ordersItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.ordersItemService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateOrdersItemDto: UpdateOrdersItemDto) {
    return this.ordersItemService.update(id, updateOrdersItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.ordersItemService.remove(id);
  }
}
