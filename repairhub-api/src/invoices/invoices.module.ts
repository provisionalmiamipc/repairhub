import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../common/email/email.module';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { SOItem } from '../s_o_items/entities/s_o_item.entity';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoicePaymentLink } from './entities/invoice-payment-link.entity';
import { InvoicePaymentLinksService } from './invoice-payment-links.service';
import { SquarePaymentLinksService } from '../service_orders/square-payment-links.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, InvoicePaymentLink, ServiceOrder, SOItem]), EmailModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicePdfService, InvoicePaymentLinksService, SquarePaymentLinksService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
