import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SODiagnosticService } from './s_o_diagnostic.service';
import { SODiagnosticController } from './s_o_diagnostic.controller';
import { SODiagnostic } from './entities/s_o_diagnostic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SODiagnostic])],
  controllers: [SODiagnosticController],
  providers: [SODiagnosticService],
})
export class SODiagnosticModule {}
