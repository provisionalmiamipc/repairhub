import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrdersService } from './service_orders.service';
import { ServiceOrdersController } from './service_orders.controller';
import { ServiceOrder } from './entities/service_order.entity';
import { ServiceOrderPdfService } from './pdf.service';
import { ServiceOrderPuppeteerPdfService } from './puppeteer-pdf.service';
import { ServiceOrderSampleOverlayPdfService } from './sample-overlay-pdf.service';
import { ServiceOrderMailService } from './mail.service';
import { ServiceOrderPdfJobService } from './pdf-job.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder])],
  controllers: [ServiceOrdersController],
  providers: [
    ServiceOrdersService,
    ServiceOrderPdfService,
    ServiceOrderPuppeteerPdfService,
    ServiceOrderSampleOverlayPdfService,
    ServiceOrderMailService,
    ServiceOrderPdfJobService,
  ],
})
export class ServiceOrdersModule {}
