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

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder, RepairStatus]), MediaModule, EmailModule],
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
  ],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
