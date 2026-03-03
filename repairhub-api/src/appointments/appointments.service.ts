import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduledNotificationsService } from '../notifications/scheduled-notifications.service';
import { EmailService } from '../common/email.service';
import { Customer } from '../customers/entities/customer.entity';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly notificationsService: NotificationsService,
    private readonly scheduledNotificationsService: ScheduledNotificationsService,
    private readonly emailService: EmailService,
  ) {}

  formatDateToMMDDYYYY(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0-11
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

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
    const customer = saved.ecustomerId
      ? await this.customerRepository.findOne({ where: { id: saved.ecustomerId } })
      : null;
    const assignedTech = saved.assignedTechId
      ? await this.employeeRepository.findOne({ where: { id: saved.assignedTechId } })
      : null;
    const customerEmail = customer?.email || null;
    const customerName = customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : (saved.customer || 'Customer');
    const techEmail = assignedTech?.email || null;
    const techName = assignedTech ? `${assignedTech.firstName || ''} ${assignedTech.lastName || ''}`.trim() : 'Technician';
    const taskSummary = saved.notes || 'Scheduled technical service';

    // Create immediate notification for assigned tech
    try {
      if (saved.assignedTechId) {
        await this.notificationsService.createAndEmit({
          title: `New assigned appointment: ${saved.appointmentCode}`,
          message: `You have a new appointment scheduled for ${this.formatDateToMMDDYYYY(new Date(saved.date))} at ${saved.time}`,
          employeeId: saved.assignedTechId,
          centerId: saved.centerId,
          storeId: saved.storeId,
          actionUrl: `appointments/${saved.id}`,
          isBroadcast: false,
        } as any);
      }
    } catch (e) {
      // log but don't block appointment creation
      Logger.warn(`Failed creating immediate notification: ${e}`);
    }

    // Send immediate email to customer when linked customer exists
    try {
      if (customerEmail) {
        void this.emailService.sendCustomerAppointmentScheduled({
          to: customerEmail,
          customerName,
          appointmentCode: saved.appointmentCode,
          date: saved.date,
          time: saved.time,
        }).catch((err) => Logger.warn(`Failed sending appointment scheduled email: ${err}`));
      }
    } catch (e) {
      Logger.warn(`Failed dispatching appointment scheduled email: ${e}`);
    }

    // Schedule day-before reminders for technician/customer
    try {
      await this.rescheduleAppointmentReminders(saved);
    } catch (e) {
      Logger.warn(`Failed scheduling appointment reminders: ${e}`);
    }

    return saved;
  }

  private buildReminderRunAt(dateValue: string, timeValue?: string | null): Date {
    const dateOnly = String(dateValue || '').split('T')[0];
    const appointmentDate = new Date(`${dateOnly}T00:00:00`);
    const runAt = isNaN(appointmentDate.getTime()) ? new Date() : appointmentDate;
    runAt.setDate(runAt.getDate() - 1);
    // Day-before reminder at fixed hour avoids depending on exact appointment hour.
    runAt.setHours(9, 0, 0, 0);

    // If reminder time is already in the past but appointment is still upcoming,
    // run it shortly after creation/update so it is not silently skipped.
    const appointmentTime = (timeValue && String(timeValue).trim()) ? String(timeValue).trim() : '09:00';
    const appointmentDateTime = new Date(`${dateOnly}T${appointmentTime}:00`);
    const now = new Date();
    if (runAt <= now && !isNaN(appointmentDateTime.getTime()) && appointmentDateTime > now) {
      return new Date(now.getTime() + 60 * 1000);
    }

    return runAt;
  }

  private async rescheduleAppointmentReminders(appointment: Appointment): Promise<void> {
    await this.scheduledNotificationsService.deletePendingForAppointment(appointment.id, [
      'tech_appointment_reminder',
      'customer_appointment_reminder',
    ]);

    if (!appointment.date || appointment.cloused || appointment.canceled) return;

    const [customer, assignedTech] = await Promise.all([
      appointment.ecustomerId
        ? this.customerRepository.findOne({ where: { id: appointment.ecustomerId } })
        : Promise.resolve(null),
      appointment.assignedTechId
        ? this.employeeRepository.findOne({ where: { id: appointment.assignedTechId } })
        : Promise.resolve(null),
    ]);

    const runAt = this.buildReminderRunAt(appointment.date, appointment.time);
    const timeLabel = appointment.time || '09:00';
    const customerEmail = customer?.email || null;
    const customerName = customer
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : (appointment.customer || 'Customer');
    const techEmail = assignedTech?.email || null;
    const techName = assignedTech
      ? `${assignedTech.firstName || ''} ${assignedTech.lastName || ''}`.trim()
      : 'Technician';
    const taskSummary = appointment.notes || 'Scheduled technical service';

    if (appointment.assignedTechId) {
      const techPayload = {
        kind: 'tech_appointment_reminder',
        title: `Reminder: appointment ${appointment.appointmentCode}`,
        message: `You have an appointment on ${this.formatDateToMMDDYYYY(new Date(appointment.date))} at ${timeLabel}. Task: ${taskSummary}`,
        appointmentCode: appointment.appointmentCode,
        date: appointment.date,
        time: appointment.time,
        actionUrl: `appointments/${appointment.id}`,
        email: techEmail,
        techName,
      };
      await this.scheduledNotificationsService.scheduleForAppointment(
        appointment.id,
        runAt,
        techPayload,
        appointment.assignedTechId,
        appointment.centerId,
        appointment.storeId,
      );
    }

    if (customerEmail) {
      const customerPayload = {
        kind: 'customer_appointment_reminder',
        appointmentCode: appointment.appointmentCode,
        date: appointment.date,
        time: appointment.time,
        email: customerEmail,
        customerName,
      };
      await this.scheduledNotificationsService.scheduleForAppointment(
        appointment.id,
        runAt,
        customerPayload,
        undefined,
        appointment.centerId,
        appointment.storeId,
      );
    }
  }

  async findAll() {
    return this.appointmentRepository.find();
  }

  async findOne(id: number) {
    return this.appointmentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    await this.appointmentRepository.update(id, updateAppointmentDto);
    const updated = await this.findOne(id);
    if (updated) {
      try {
        await this.rescheduleAppointmentReminders(updated);
      } catch (e) {
        Logger.warn(`Failed rescheduling reminders for appointment ${id}: ${e}`);
      }
    }
    return updated;
  }

  async remove(id: number) {
    await this.appointmentRepository.delete(id);
    return { deleted: true };
  }
}
