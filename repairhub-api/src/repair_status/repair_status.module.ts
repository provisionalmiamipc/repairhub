import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairStatusService } from './repair_status.service';
import { RepairStatusController } from './repair_status.controller';
import { RepairStatus } from './entities/repair_status.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { EmailModule } from '../common/email/email.module';
import { Warranty } from '../warranties/entities/warranty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairStatus, ServiceOrder, Warranty]), EmailModule],
  controllers: [RepairStatusController],
  providers: [RepairStatusService],
})
export class RepairStatusModule {}
