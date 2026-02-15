import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SODiagnosticService } from './s_o_diagnostic.service';
import { SODiagnosticController } from './s_o_diagnostic.controller';
import { SODiagnostic } from './entities/s_o_diagnostic.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { Employee } from '../employees/entities/employee.entity';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([SODiagnostic, ServiceOrder, Employee]), EmailModule],
  controllers: [SODiagnosticController],
  providers: [SODiagnosticService],
})
export class SODiagnosticModule {}
