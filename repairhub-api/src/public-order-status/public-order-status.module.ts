import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { PublicOrderStatusController } from './public-order-status.controller';
import { PublicOrderStatusService } from './public-order-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrder])],
  controllers: [PublicOrderStatusController],
  providers: [PublicOrderStatusService],
})
export class PublicOrderStatusModule {}
