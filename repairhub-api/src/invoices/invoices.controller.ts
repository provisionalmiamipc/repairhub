import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SendInvoiceEmailDto } from './dto/send-invoice-email.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
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
  findAll(@Query('customerId') customerId?: string) {
    const parsed = customerId ? Number(customerId) : undefined;
    return this.service.findAll(Number.isFinite(parsed) ? parsed : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const invoice = await this.service.findOne(id);
    const pdf = await this.service.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    return res.send(pdf);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/items')
  addItems(@Param('id', ParseIntPipe) id: number, @Body() items: CreateInvoiceItemDto[]) {
    return this.service.addItems(id, items);
  }

  @Post(':id/service-orders/:serviceOrderId')
  addServiceOrder(
    @Param('id', ParseIntPipe) id: number,
    @Param('serviceOrderId', ParseIntPipe) serviceOrderId: number,
  ) {
    return this.service.addServiceOrder(id, serviceOrderId);
  }

  @Patch(':id/items')
  replaceItems(@Param('id', ParseIntPipe) id: number, @Body() items: CreateInvoiceItemDto[]) {
    return this.service.replaceItems(id, items);
  }

  @Patch(':id/issue')
  issue(@Param('id', ParseIntPipe) id: number) {
    return this.service.issue(id);
  }

  @Patch(':id/pay')
  recordPayment(@Param('id', ParseIntPipe) id: number, @Body() dto: RecordPaymentDto) {
    return this.service.recordPayment(id, dto);
  }

  @Post(':id/send-email')
  sendEmail(@Param('id', ParseIntPipe) id: number, @Body() dto: SendInvoiceEmailDto) {
    return this.service.sendEmail(id, dto);
  }

  @Patch(':id/void')
  void(@Param('id', ParseIntPipe) id: number, @Body() dto: VoidInvoiceDto) {
    return this.service.void(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
