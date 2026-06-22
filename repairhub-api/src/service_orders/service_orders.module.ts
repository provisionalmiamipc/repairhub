import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrdersService } from './service_orders.service';
import { ServiceOrdersController } from './service_orders.controller';
import { ServiceOrder } from './entities/service_order.entity';
import { RepairStatus } from '../repair_status/entities/repair_status.entity';
import { ServiceOrderPdfService } from './pdf.service';
import { RepairPdfService } from './so-pdf.service';
import { ServiceOrderPuppeteerPdfService } from './puppeteer-pdf.service';

import { ServiceOrderMailService } from './mail.service';
import { ServiceOrderPdfJobService } from './pdf-job.service';
import { MediaModule } from '../media/media.module';
import { EmailModule } from '../common/email/email.module';
import { ServiceOrderPaymentLink } from './entities/service-order-payment-link.entity';
import { ServiceOrderPaymentLinksService } from './service-order-payment-links.service';
import { SquarePaymentLinksService } from './square-payment-links.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder, RepairStatus, ServiceOrderPaymentLink]), MediaModule, EmailModule, LlmModule],
  controllers: [ServiceOrdersController],
  providers: [
    ServiceOrdersService,
    // Use RepairPdfService as the implementation for ServiceOrderPdfService
    {
      provide: ServiceOrderPdfService,
      useClass: RepairPdfService,
    },
    ServiceOrderPuppeteerPdfService,
    ServiceOrderMailService,
    ServiceOrderPdfJobService,
    SquarePaymentLinksService,
    ServiceOrderPaymentLinksService,
  ],
  exports: [ServiceOrdersService, ServiceOrderPaymentLinksService],
})
export class ServiceOrdersModule {}
