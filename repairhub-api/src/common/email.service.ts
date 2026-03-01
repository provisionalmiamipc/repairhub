import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { resolveUpload, resolveTemplate } from './asset-utils';
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
    const resendKey = process.env.RESEND_API_KEY || this.config.get<string>('RESEND_API_KEY');

    try {
      if (resendKey) {
        const context = {
          fullName: options.fullName ?? 'User',
          employeeCode: options.employeeCode ?? 'N/A',
          pin: options.pin,
          tempPassword: options.tempPassword,
          appUrl,
          activationLink: (options as any).activationLink,
        };
        let html = `<p>Welcome ${context.fullName}</p>`;
        const tplPath = resolveTemplate('welcome.hbs');
        if (tplPath) {
          try {
            const src = fs.readFileSync(tplPath, 'utf8');
            const tpl = handlebars.compile(src);
            html = tpl(context);
          } catch (_e) {
            // keep fallback html
          }
        }

        const fromEmail = this.config.get('FROM_EMAIL') || `no-reply@${this.config.get('SMTP_HOST') || 'repairhub'}`;
        const fromName = this.config.get('FROM_NAME') || '';
        const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({ from: fromHeader, to: options.to, subject, html }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Resend API error: ${res.status} ${text}`);
        }
        this.logger.log(`Welcome email sent via Resend to ${options.to}`);
        return;
      }

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
    const resendKey = process.env.RESEND_API_KEY || this.config.get<string>('RESEND_API_KEY');
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

      if (resendKey) {
        let html = `<p>Dear ${context.customerName}, your order #${context.orderCode} status is ${context.status}.</p>`;
        const tplPath = resolveTemplate('repair-status-updated.hbs');
        if (tplPath) {
          try {
            const src = fs.readFileSync(tplPath, 'utf8');
            const tpl = handlebars.compile(src);
            html = tpl(context);
          } catch (_e) {
            // keep fallback html
          }
        }

        const fromEmail = this.config.get('FROM_EMAIL') || `no-reply@${this.config.get('SMTP_HOST') || 'repairhub'}`;
        const fromName = this.config.get('FROM_NAME') || '';
        const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        const resendAttachments = attachments.map((att) => {
          const content = att.path && fs.existsSync(att.path) ? fs.readFileSync(att.path).toString('base64') : null;
          if (!content) return null;
          return {
            filename: att.filename,
            content,
            content_type: att.contentType,
            content_id: att.cid,
            disposition: 'inline',
          };
        }).filter(Boolean);

        const payload: any = { from: fromHeader, to: options.to, subject, html };
        if (resendAttachments.length > 0) payload.attachments = resendAttachments;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Resend API error: ${res.status} ${text}`);
        }
        this.logger.log(`Repair status update email sent via Resend to ${options.to}`);
        return;
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
