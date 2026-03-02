import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { NotificationsService } from './notifications.service';
import { EmailService } from '../common/email.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly scheduledService: ScheduledNotificationsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDue() {
    const due = await this.scheduledService.findDue(100);
    if (!due || due.length === 0) return;

    for (const job of due) {
      try {
        const payload = job.payload ? JSON.parse(job.payload) : {};
        const kind = payload.kind || 'tech_appointment_reminder';

        if (kind === 'customer_appointment_reminder') {
          if (payload.email) {
            try {
              await this.emailService.sendCustomerAppointmentReminder({
                to: payload.email,
                customerName: payload.customerName || 'Customer',
                appointmentCode: payload.appointmentCode || 'N/A',
                date: payload.date || new Date().toISOString(),
                time: payload.time || undefined,
              });
            } catch (e) {
              this.logger.warn(`Failed sending customer reminder email for scheduled job ${job.id}: ${e}`);
            }
          }
          await this.scheduledService.markSent(job.id);
          continue;
        }

        // create internal notification for employee reminders
        if (job.employeeId) {
          await this.notificationsService.createAndEmit({
            title: payload.title || 'Appointment reminder',
            message: payload.message || 'You have an upcoming appointment',
            employeeId: job.employeeId,
            centerId: job.centerId,
            storeId: job.storeId,
            actionUrl: payload.actionUrl || undefined,
            isBroadcast: false,
          } as any);
        }

        // send email if recipient provided
        if (payload.email) {
          try {
            await this.emailService.sendAppointmentReminder({
              to: payload.email,
              techName: payload.techName || 'Technician',
              appointmentCode: payload.appointmentCode || 'N/A',
              date: payload.date || new Date().toISOString(),
              message: payload.message || 'You have an upcoming appointment',
            });
          } catch (e) {
            this.logger.warn(`Failed sending reminder email for scheduled job ${job.id}: ${e}`);
          }
        }

        await this.scheduledService.markSent(job.id);
      } catch (err) {
        this.logger.error(`Error processing scheduled notification ${job.id}: ${err}`);
        try { await this.scheduledService.markFailed(job.id); } catch (_) { /* ignore */ }
      }
    }
  }
}
