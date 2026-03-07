import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairCasesController } from './repair_cases.controller';
import { RepairCasesService } from './repair_cases.service';
import { RepairCase } from './entities/repair_case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairCase])],
  controllers: [RepairCasesController],
  providers: [RepairCasesService],
  exports: [RepairCasesService],
})
export class RepairCasesModule {}
