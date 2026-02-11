import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { ActivationToken } from '../auth/entities/activation-token.entity';
import { EmailService } from '../common/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ActivationToken])],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmailService],
  exports: [EmployeesService], 
})
export class EmployeesModule {}
