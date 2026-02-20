import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { resolveUpload } from './asset-utils';
import * as fs from 'fs';
import * as path from 'path';
const handlebars = require('handlebars');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService, private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(options: {
    to: string;
    fullName?: string;
    employeeCode?: string;
    pin: string;
    tempPassword: string;
  }) {
    const appUrl = this.config.get<string>('APP_URL') || this.config.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const subject = `Welcome to Miami Photography Center.`;

    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject,
        template: 'welcome',
        context: {
          fullName: options.fullName ?? 'User',
          employeeCode: options.employeeCode ?? 'N/A',
          pin: options.pin,
          tempPassword: options.tempPassword,
          appUrl,
          activationLink: (options as any).activationLink,
        },
      });

      this.logger.log(`Welcome email queued/sent to ${options.to}`);
    } catch (error) {
      this.logger.error('Error sending welcome email', error as any);
    }
  }

  async sendRepairStatusUpdate(options: { to: string; customerName: string; orderCode: string; status: string; date: string | Date; }) {
    const subject = `Order status update #${options.orderCode}`;
    try {
      // try to resolve a logo in uploads
      let logoPath: string | null = null;
      try {
        logoPath = resolveUpload(['sopdf1.jpg', 'logo.png', 'logo.jpg']);
      } catch (e) {
        // ignore
      }

      const context = {
        customerName: options.customerName,
        orderCode: options.orderCode,
        status: options.status,
        date: typeof options.date === 'string' ? options.date : new Date(options.date).toLocaleString(),
      };

      const attachments: any[] = [];
      if (logoPath) {
        attachments.push({ filename: path.basename(logoPath), path: logoPath, cid: 'logo@repairhub', contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg' });
      }

      await this.mailerService.sendMail({
        to: options.to,
        subject,
        template: 'repair-status-updated',
        context,
        attachments,
      });

      this.logger.log(`Repair status update email queued/sent to ${options.to}`);
    } catch (error) {
      this.logger.error('Error sending repair status update email', error as any);
    }
  }

  async sendAppointmentReminder(options: { to: string; techName?: string; appointmentCode?: string; date?: string | Date; message?: string }) {
    const subject = `Appointment reminder ${options.appointmentCode || ''}`;
    try {
      const resendKey = process.env.RESEND_API_KEY;
      const context = {
        techName: options.techName || 'Technician',
        appointmentCode: options.appointmentCode || '',
        date: typeof options.date === 'string' ? options.date : (options.date ? new Date(options.date).toLocaleString() : ''),
        message: options.message || 'You have an appointment scheduled for tomorrow.',
      };
      if (resendKey) {
        let html = `<p>${context.message}</p>`;
        try {
          const candidate = path.join(__dirname, '..', 'templates', 'emails', 'appointment-reminder.hbs');
          if (fs.existsSync(candidate)) {
            const src = fs.readFileSync(candidate, 'utf8');
            const tpl = handlebars.compile(src);
            html = tpl(context);
          }
        } catch (e) {}
        const payload = { from: this.config.get('FROM_EMAIL') || `no-reply@${this.config.get('SMTP_HOST') || 'repairhub'}`, to: options.to, subject, html } as any;
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          this.logger.error('Resend API error: ' + res.status + ' ' + text);
          throw new Error('Resend API error');
        }
        this.logger.log(`Appointment reminder sent via Resend to ${options.to}`);
      } else {
        await this.mailerService.sendMail({
          to: options.to,
          subject,
          template: 'appointment-reminder',
          context,
        });
        this.logger.log(`Appointment reminder queued/sent to ${options.to}`);
      }
    } catch (error) {
      this.logger.error('Error sending appointment reminder email', error as any);
    }
  }
}
