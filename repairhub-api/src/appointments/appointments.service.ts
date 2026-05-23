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
  private readonly appointmentTimezone = 'America/New_York';

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

  private buildDayBeforeReminderRunAt(dateValue: string, timeValue?: string | null): Date | null {
    const dateOnly = String(dateValue || '').split('T')[0];
    const dateParts = this.parseDateParts(dateOnly);
    if (!dateParts) return null;

    const reminderDate = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day));
    reminderDate.setUTCDate(reminderDate.getUTCDate() - 1);

    const runAt = this.zonedTimeToUtc(
      reminderDate.getUTCFullYear(),
      reminderDate.getUTCMonth() + 1,
      reminderDate.getUTCDate(),
      9,
      0,
      this.appointmentTimezone,
    );
    const appointmentDateTime = this.buildAppointmentDateTime(dateOnly, timeValue);
    return this.normalizeReminderRunAt(runAt, appointmentDateTime);
  }

  private buildTwoHoursBeforeReminderRunAt(dateValue: string, timeValue?: string | null): Date | null {
    const dateOnly = String(dateValue || '').split('T')[0];
    const appointmentDateTime = this.buildAppointmentDateTime(dateOnly, timeValue);
    if (!appointmentDateTime) return null;

    const runAt = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
    return this.normalizeReminderRunAt(runAt, appointmentDateTime);
  }

  private buildAppointmentDateTime(dateOnly: string, timeValue?: string | null): Date | null {
    const dateParts = this.parseDateParts(dateOnly);
    if (!dateParts) return null;

    const timeParts = this.parseTimeParts(timeValue);
    return this.zonedTimeToUtc(
      dateParts.year,
      dateParts.month,
      dateParts.day,
      timeParts.hour,
      timeParts.minute,
      this.appointmentTimezone,
    );
  }

  private normalizeReminderRunAt(runAt: Date, appointmentDateTime: Date | null): Date | null {
    const now = new Date();
    if (!appointmentDateTime || appointmentDateTime <= now) return null;
    if (runAt <= now) {
      return new Date(now.getTime() + 60 * 1000);
    }

    return runAt;
  }

  private parseDateParts(dateOnly: string): { year: number; month: number; day: number } | null {
    const match = String(dateOnly || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  private parseTimeParts(timeValue?: string | null): { hour: number; minute: number } {
    const match = String(timeValue || '09:00').trim().match(/^(\d{1,2}):(\d{2})/);
    const hour = match ? Number(match[1]) : 9;
    const minute = match ? Number(match[2]) : 0;

    return {
      hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : 9,
      minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 0,
    };
  }

  private zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
    const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
    const zonedParts = this.getZonedDateParts(guess, timeZone);
    const targetUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const zonedUtc = Date.UTC(
      zonedParts.year,
      zonedParts.month - 1,
      zonedParts.day,
      zonedParts.hour,
      zonedParts.minute,
      zonedParts.second,
      0,
    );

    return new Date(guess.getTime() + targetUtc - zonedUtc);
  }

  private getZonedDateParts(date: Date, timeZone: string): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = formatter.formatToParts(date).reduce<Record<string, number>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = Number(part.value);
      }
      return acc;
    }, {});

    return {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
    };
  }

  private shouldSkipCustomerDayBeforeReminder(appointment: Appointment, referenceDate: Date = new Date(appointment.createdAt)): boolean {
    if (!appointment.createdAt || !appointment.date) return false;

    const dateOnly = String(appointment.date || '').split('T')[0];
    const appointmentDateParts = this.parseDateParts(dateOnly);
    if (!appointmentDateParts) return false;

    const reminderDate = new Date(Date.UTC(
      appointmentDateParts.year,
      appointmentDateParts.month - 1,
      appointmentDateParts.day,
    ));
    reminderDate.setUTCDate(reminderDate.getUTCDate() - 1);

    const reminderDateKey = this.toDateKey({
      year: reminderDate.getUTCFullYear(),
      month: reminderDate.getUTCMonth() + 1,
      day: reminderDate.getUTCDate(),
    });
    const referenceDateKey = this.toDateKey(
      this.getZonedDateParts(referenceDate, this.appointmentTimezone),
    );

    return referenceDateKey >= reminderDateKey;
  }

  private toDateKey(parts: { year: number; month: number; day: number }): number {
    return (parts.year * 10000) + (parts.month * 100) + parts.day;
  }

  private async rescheduleAppointmentReminders(appointment: Appointment, options?: { customerImmediateEmailSent?: boolean }): Promise<void> {
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

    const dayBeforeRunAt = this.buildDayBeforeReminderRunAt(appointment.date, appointment.time);
    const twoHoursBeforeRunAt = this.buildTwoHoursBeforeReminderRunAt(appointment.date, appointment.time);
    const skipCustomerDayBeforeReminder = this.shouldSkipCustomerDayBeforeReminder(
      appointment,
      options?.customerImmediateEmailSent ? new Date() : new Date(appointment.createdAt),
    );
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
        reminderType: 'day_before_9am',
        title: `Reminder: appointment ${appointment.appointmentCode}`,
        message: `You have an appointment on ${appointment.date} at ${timeLabel}. Task: ${taskSummary}`,
        appointmentCode: appointment.appointmentCode,
        date: appointment.date,
        time: appointment.time,
        actionUrl: `appointments/${appointment.id}`,
        email: techEmail,
        techName,
      };

      if (dayBeforeRunAt) {
        await this.scheduledNotificationsService.scheduleForAppointment(
          appointment.id,
          dayBeforeRunAt,
          techPayload,
          appointment.assignedTechId,
          appointment.centerId,
          appointment.storeId,
        );
      }

      if (twoHoursBeforeRunAt) {
        await this.scheduledNotificationsService.scheduleForAppointment(
          appointment.id,
          twoHoursBeforeRunAt,
          {
            ...techPayload,
            reminderType: 'two_hours_before',
            title: `Upcoming appointment: ${appointment.appointmentCode}`,
            message: `Your appointment is in about 2 hours: ${appointment.date} at ${timeLabel}. Task: ${taskSummary}`,
          },
          appointment.assignedTechId,
          appointment.centerId,
          appointment.storeId,
        );
      }
    }

    if (customerEmail) {
      const customerPayload = {
        kind: 'customer_appointment_reminder',
        reminderType: 'day_before_9am',
        appointmentCode: appointment.appointmentCode,
        date: appointment.date,
        time: appointment.time,
        email: customerEmail,
        customerName,
      };
      if (dayBeforeRunAt && !skipCustomerDayBeforeReminder) {
        await this.scheduledNotificationsService.scheduleForAppointment(
          appointment.id,
          dayBeforeRunAt,
          customerPayload,
          undefined,
          appointment.centerId,
          appointment.storeId,
        );
      }

      if (twoHoursBeforeRunAt) {
        await this.scheduledNotificationsService.scheduleForAppointment(
          appointment.id,
          twoHoursBeforeRunAt,
          {
            ...customerPayload,
            reminderType: 'two_hours_before',
            message: 'Your appointment is coming up in about 2 hours.',
          },
          undefined,
          appointment.centerId,
          appointment.storeId,
        );
      }
    }
  }

  async findAll() {
    return this.appointmentRepository.find();
  }

  async findOne(id: number) {
    return this.appointmentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const previous = await this.findOne(id);
    await this.appointmentRepository.update(id, updateAppointmentDto);
    const updated = await this.findOne(id);
    if (updated) {
      const shouldNotifyCustomer = this.shouldNotifyCustomerAppointmentUpdated(previous, updated);
      if (shouldNotifyCustomer) {
        try {
          await this.dispatchCustomerAppointmentUpdatedEmail(updated);
        } catch (e) {
          Logger.warn(`Failed dispatching appointment updated email for appointment ${id}: ${e}`);
        }
      }

      try {
        await this.rescheduleAppointmentReminders(updated, { customerImmediateEmailSent: shouldNotifyCustomer });
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

  private shouldNotifyCustomerAppointmentUpdated(previous: Appointment | null, updated: Appointment): boolean {
    if (!previous) return false;
    if (updated.canceled || updated.cloused) return false;

    return previous.date !== updated.date ||
      previous.time !== updated.time ||
      previous.ecustomerId !== updated.ecustomerId ||
      previous.customer !== updated.customer;
  }

  private async dispatchCustomerAppointmentUpdatedEmail(appointment: Appointment): Promise<void> {
    if (!appointment.ecustomerId) return;

    const customer = await this.customerRepository.findOne({ where: { id: appointment.ecustomerId } });
    const customerEmail = customer?.email || null;
    if (!customerEmail) return;

    const customerName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() ||
      appointment.customer ||
      'Customer';

    await this.emailService.sendCustomerAppointmentUpdated({
      to: customerEmail,
      customerName,
      appointmentCode: appointment.appointmentCode,
      date: appointment.date,
      time: appointment.time,
    });
  }
}
