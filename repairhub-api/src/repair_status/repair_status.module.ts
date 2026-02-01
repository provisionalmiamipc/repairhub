import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairStatusService } from './repair_status.service';
import { RepairStatusController } from './repair_status.controller';
import { RepairStatus } from './entities/repair_status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairStatus])],
  controllers: [RepairStatusController],
  providers: [RepairStatusService],
})
export class RepairStatusModule {}
