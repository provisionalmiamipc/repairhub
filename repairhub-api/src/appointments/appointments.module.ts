import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../common/email.service';


@Module({
  imports: [TypeOrmModule.forFeature([Appointment]), NotificationsModule, MailerModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, EmailService],
})
export class AppointmentsModule {}
