import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisSession } from './entities/diagnosis_session.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { ChatMessage } from '../chat_messages/entities/chat_message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiagnosisSession, ServiceOrder, ChatMessage])],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
