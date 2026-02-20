import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduledNotificationsService } from '../notifications/scheduled-notifications.service';
import { EmailService } from '../common/email.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly notificationsService: NotificationsService,
    private readonly scheduledNotificationsService: ScheduledNotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Obtener el último appointmentCode
    const lastAppointment = await this.appointmentRepository.createQueryBuilder('ap')
      .orderBy('ap.appointmentCode', 'DESC')
      .where('ap.appointmentCode LIKE :prefix', { prefix: 'AP%' })
      .getOne();

    let nextNumber = 1;
    if (lastAppointment && lastAppointment.appointmentCode) {
      const match = lastAppointment.appointmentCode.match(/AP(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const appointmentCode = `AP${nextNumber.toString().padStart(5, '0')}`;

    const appointment = this.appointmentRepository.create({ ...createAppointmentDto, appointmentCode });
    const saved = await this.appointmentRepository.save(appointment);

    // Create immediate notification for assigned tech
    try {
      if (saved.assignedTechId) {
        await this.notificationsService.createAndEmit({
          title: `New assigned appointment: ${saved.appointmentCode}`,
          message: `You have a new appointment scheduled for ${new Date(saved.date).toLocaleString()}`,
          employeeId: saved.assignedTechId,
          centerId: saved.centerId,
          storeId: saved.storeId,
          actionUrl: `/appointments/${saved.id}`,
          isBroadcast: false,
        } as any);
      }
    } catch (e) {
      // log but don't block appointment creation
      Logger.warn(`Failed creating immediate notification: ${e}`);
    }

    // Schedule reminder 1 day before
    try {
      if (saved.assignedTechId && saved.date) {
        const runAt = new Date(saved.date);
        runAt.setDate(runAt.getDate() - 1);
        const payload = {
          title: `Reminder: appointment ${saved.appointmentCode}`,
          message: `You have an appointment on ${new Date(saved.date).toLocaleString()}`,
          appointmentCode: saved.appointmentCode,
          date: saved.date,
          actionUrl: `/appointments/${saved.id}`,
          email: (saved as any).techEmail || null,
          techName: (saved as any).techName || null,
        };
        await this.scheduledNotificationsService.scheduleForAppointment(saved.id, runAt, payload, saved.assignedTechId, saved.centerId, saved.storeId);
      }
    } catch (e) {
      Logger.warn(`Failed scheduling reminder: ${e}`);
    }

    return saved;
  }

  async findAll() {
    return this.appointmentRepository.find();
  }

  async findOne(id: number) {
    return this.appointmentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    await this.appointmentRepository.update(id, updateAppointmentDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.appointmentRepository.delete(id);
    return { deleted: true };
  }
}
