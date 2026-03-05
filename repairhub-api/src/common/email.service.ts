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
    const logoAttachments = this.getLogoCidAttachments();
    const hasLogo = logoAttachments.length > 0;

    try {
      const context = {
        fullName: options.fullName ?? 'User',
        employeeCode: options.employeeCode ?? 'N/A',
        pin: options.pin,
        tempPassword: options.tempPassword,
        appUrl,
        activationLink: (options as any).activationLink,
        hasLogo,
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

      await this.sendHtmlWithResendFallback(options.to, subject, html, logoAttachments);
      this.logger.log(`Welcome email sent to ${options.to}`);
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
        logoPath = resolveUpload(['sopdf.jpg', 'sopdf1.jpg', 'logo.png', 'logo.jpg']);
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
        attachments.push({
          filename: path.basename(logoPath),
          path: logoPath,
          cid: 'logo@repairhub',
          contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
          contentDisposition: 'inline',
          disposition: 'inline',
        });
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
            cid: att.cid,
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

  async sendAppointmentReminder(options: { 
    to: string;
     techName?: string; 
     appointmentCode?: string; 
     date?: string | Date; 
     time?: string;
     message?: string }) {
    const subject = `Appointment reminder ${options.appointmentCode || ''}`;
    try {
      const context = {
        techName: options.techName || 'Technician',
        appointmentCode: options.appointmentCode || '',
        date: typeof options.date === 'string' ? options.date : (options.date ? new Date(options.date).toLocaleString() : ''),
        time: options.time || '',
        message: options.message || 'You have an appointment scheduled for tomorrow.',
      };
      const logoAttachments = this.getLogoCidAttachments();
      const logoHtml = logoAttachments.length ? `<img src="cid:logo@repairhub" alt="Logo" style="height:56px;" />` : '';
      const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; background:#f8fafc; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:20px 24px; border-bottom:1px solid #e5e7eb;">
                ${logoHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;">Hello <strong>${context.techName}</strong>,</p>
                <p style="margin:0 0 12px 0;">${context.message}</p>
                <p style="margin:0 0 12px 0;"><strong>Appointment:</strong> #${context.appointmentCode}</p>
                <p style="margin:0 0 12px 0;"><strong>Date & time:</strong> ${context.date} at ${context.time}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px; font-size:12px; color:#6b7280; background:#f9fafb;">
                This is an automated message, please do not reply directly.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
      await this.sendHtmlWithResendFallback(options.to, subject, html, logoAttachments);
      this.logger.log(`Appointment reminder sent to ${options.to}`);
    } catch (error) {
      this.logger.error('Error sending appointment reminder email', error as any);
      throw error;
    }
  }

  async sendCustomerAppointmentScheduled(options: {
    to: string;
    customerName?: string;
    appointmentCode: string;
    date: string | Date;
    time?: string;
    storeName?: string;
    centerName?: string;
    deviceName?: string;
  }) {
    const dateLabel = this.formatDateTimeLabel(options.date, options.time);
    const logoAttachments = this.getLogoCidAttachments();
    const logoHtml = logoAttachments.length ? `<img src="cid:logo@repairhub" alt="Logo" style="height:56px;" />` : '';
    const subject = `Appointment scheduled #${options.appointmentCode}`;
    const customerName = options.customerName || 'Customer';
    const location = [options.storeName, options.centerName].filter(Boolean).join(' - ');
    const locationHtml = location ? `<p><strong>Location:</strong> ${location}</p>` : '';
    const deviceHtml = options.deviceName ? `<p><strong>Device:</strong> ${options.deviceName}</p>` : '';

    const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; background:#f8fafc; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:20px 24px; border-bottom:1px solid #e5e7eb;">
                ${logoHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;">Hello <strong>${customerName}</strong>,</p>
                <p style="margin:0 0 12px 0;">Your appointment has been scheduled successfully.</p>
                <p style="margin:0 0 12px 0;"><strong>Appointment:</strong> #${options.appointmentCode}</p>
                <p style="margin:0 0 12px 0;"><strong>Date & time:</strong> ${dateLabel}</p>
                ${locationHtml}
                ${deviceHtml}
                <p style="margin:20px 0 0 0;">If you need to reschedule, please contact us.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px; font-size:12px; color:#6b7280; background:#f9fafb;">
                This is an automated message, please do not reply directly.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await this.sendHtmlWithResendFallback(options.to, subject, html, logoAttachments);
  }

  async sendCustomerAppointmentReminder(options: {
    to: string;
    customerName?: string;
    appointmentCode: string;
    date: string | Date;
    time?: string;
    storeName?: string;
    centerName?: string;
    deviceName?: string;
  }) {
    const dateLabel = this.formatDateTimeLabel(options.date, options.time);
    const logoAttachments = this.getLogoCidAttachments();
    const logoHtml = logoAttachments.length ? `<img src="cid:logo@repairhub" alt="Logo" style="height:56px;" />` : '';
    const subject = `Reminder: appointment #${options.appointmentCode}`;
    const customerName = options.customerName || 'Customer';
    const location = [options.storeName, options.centerName].filter(Boolean).join(' - ');
    const locationHtml = location ? `<p><strong>Location:</strong> ${location}</p>` : '';
    const deviceHtml = options.deviceName ? `<p><strong>Device:</strong> ${options.deviceName}</p>` : '';

    const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; background:#f8fafc; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:20px 24px; border-bottom:1px solid #e5e7eb;">
                ${logoHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;">Hello <strong>${customerName}</strong>,</p>
                <p style="margin:0 0 12px 0;">This is a reminder for your upcoming appointment.</p>
                <p style="margin:0 0 12px 0;"><strong>Appointment:</strong> #${options.appointmentCode}</p>
                <p style="margin:0 0 12px 0;"><strong>Date & time:</strong> ${dateLabel}</p>
                ${locationHtml}
                ${deviceHtml}
                <p style="margin:20px 0 0 0;">We look forward to assisting you.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px; font-size:12px; color:#6b7280; background:#f9fafb;">
                This is an automated message, please do not reply directly.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await this.sendHtmlWithResendFallback(options.to, subject, html, logoAttachments);
  }

  private async sendHtmlWithResendFallback(to: string, subject: string, html: string, attachments: any[] = []): Promise<void> {
    const recipient = String(to || '').trim();
    if (!recipient) throw new Error('Invalid recipient email');

    const resendKey = process.env.RESEND_API_KEY || this.config.get<string>('RESEND_API_KEY');
    const fromEmail = this.config.get('FROM_EMAIL') || `no-reply@${this.config.get('SMTP_HOST') || 'repairhub'}`;
    const fromName = this.config.get('FROM_NAME') || '';
    const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    if (resendKey) {
      const resendAttachments = attachments
        .map((att) => {
          let contentBase64: string | null = null;
          if (att?.path && fs.existsSync(att.path)) {
            contentBase64 = fs.readFileSync(att.path).toString('base64');
          } else if (att?.content && Buffer.isBuffer(att.content)) {
            contentBase64 = att.content.toString('base64');
          }
          if (!contentBase64) return null;
          return {
            filename: att.filename || 'sopdf.jpg',
            content: contentBase64,
            content_type: att.contentType || att.content_type || 'image/png',
            cid: att.cid || att.content_id || 'logo@repairhub',
            content_id: att.cid || att.content_id || 'logo@repairhub',
            content_disposition: att.contentDisposition || att.disposition || 'inline',
            disposition: att.disposition || 'inline',
          };
        })
        .filter(Boolean);

      const payload: any = { from: fromHeader, to: recipient, subject, html };
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
      this.logger.log(`Appointment email sent via Resend to ${recipient}`);
      return;
    }

    await this.mailerService.sendMail({ to: recipient, subject, html, attachments });
    this.logger.log(`Appointment email sent via SMTP to ${recipient}`);
  }

  private getLogoCidAttachments(): any[] {
    try {
      const logoPath = resolveUpload(['sopdf.jpg', 'logo.png', 'logo.jpg', 'sopdf1.jpg']);
      if (!logoPath || !fs.existsSync(logoPath)) return [];
      return [{
        filename: path.basename(logoPath),
        path: logoPath,
        cid: 'logo@repairhub',
        contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
        contentDisposition: 'inline',
        disposition: 'inline',
      }];
    } catch (_e) {
      return [];
    }
  }

  private formatDateTimeLabel(date: string | Date, time?: string): string {
    if (typeof date === 'string') {
      return time ? `${date} ${time}` : date;
    }
    const formatted = date.toLocaleDateString();
    return time ? `${formatted} ${time}` : formatted;
  }
}
