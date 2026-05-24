import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairStatus } from '../repair_status/entities/repair_status.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { Warranty } from './entities/warranty.entity';
import { WarrantiesController } from './warranties.controller';
import { WarrantiesService } from './warranties.service';

@Module({
  imports: [TypeOrmModule.forFeature([Warranty, ServiceOrder, RepairStatus])],
  controllers: [WarrantiesController],
  providers: [WarrantiesService],
  exports: [WarrantiesService],
})
export class WarrantiesModule {}
