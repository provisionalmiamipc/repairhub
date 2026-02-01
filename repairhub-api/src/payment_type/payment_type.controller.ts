import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentTypeService } from './payment_type.service';
import { CreatePaymentTypeDto } from './dto/create-payment_type.dto';
import { UpdatePaymentTypeDto } from './dto/update-payment_type.dto';

@Controller('payment-type')
export class PaymentTypeController {
  constructor(private readonly paymentTypeService: PaymentTypeService) {}

  @Post()
  create(@Body() createPaymentTypeDto: CreatePaymentTypeDto) {
    return this.paymentTypeService.create(createPaymentTypeDto);
  }

  @Get()
  findAll() {
    return this.paymentTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.paymentTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePaymentTypeDto: UpdatePaymentTypeDto) {
    return this.paymentTypeService.update(id, updatePaymentTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.paymentTypeService.remove(id);
  }
}
