import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { resolveUpload, resolveTemplate } from '../asset-utils';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly businessTimeZone = 'America/New_York';
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('EMAIL_HOST') || this.configService.get('SMTP_HOST');
    const port = this.configService.get('EMAIL_PORT') || this.configService.get('SMTP_PORT');
    const user = this.configService.get('EMAIL_USER') || this.configService.get('SMTP_USER');
    const pass = this.configService.get('EMAIL_PASS') || this.configService.get('SMTP_PASS');

    const transportOptions: any = {};
    if (host) transportOptions.host = host;
    if (port) transportOptions.port = Number(port);
    if (user && pass) transportOptions.auth = { user, pass };
    transportOptions.secure = !!this.configService.get('EMAIL_SECURE');

    this.transporter = nodemailer.createTransport(transportOptions);

    // Verify transporter configuration early so failures surface at startup
    this.transporter
      .verify()
      .catch((err) => this.logger.warn('transporter verification failed: ' + (err && err.message)));
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const fromEmail = this.configService.get('FROM_EMAIL') || this.configService.get('EMAIL_FROM') || 'system@localhost';
    const fromName = this.configService.get('FROM_NAME') || this.configService.get('EMAIL_FROM_NAME') || '';
    const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    const resendKey = this.configService.get('RESEND_API_KEY') || process.env.RESEND_API_KEY;

    const recipients = this.normalizeRecipients(options.to);
    if (recipients.length === 0) {
      throw new Error('No valid recipient email addresses');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: fromHeader,
      to: recipients,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      if (resendKey) {
        const resendAttachments = this.toResendAttachments(options.attachments || []);
        const payload: any = {
          from: fromHeader,
          to: recipients,
          subject: options.subject,
          html: options.html,
        };
        if (resendAttachments.length > 0) payload.attachments = resendAttachments;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text().catch(() => '');
        if (!res.ok) {
          const msg = text || `status=${res.status}`;
          throw new Error(`Resend API error: ${msg}`);
        }
        this.logger.log(`Email sent via Resend to ${recipients.join(',')} subject=${options.subject}`);
        return;
      }

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${recipients.join(',')} subject=${options.subject}`);
    } catch (err) {
      this.logger.error('Failed to send email', err && err.message ? err.message : err);
      throw err;
    }
  }

  private toResendAttachments(attachments: any[]): any[] {
    return attachments
      .map((att) => {
        if (!att) return null;

        const filename = att.filename || 'attachment';
        const contentType = att.contentType || att.content_type;
        const disposition = att.contentDisposition || att.disposition;
        const cid = att.cid || att.content_id;
        const contentId = att.cid || att.content_id;

        let contentBase64: string | null = null;
        try {
          if (att.content) {
            if (Buffer.isBuffer(att.content)) {
              contentBase64 = att.content.toString('base64');
            } else if (typeof att.content === 'string') {
              contentBase64 = att.content;
            }
          } else if (att.path && fs.existsSync(att.path)) {
            contentBase64 = fs.readFileSync(att.path).toString('base64');
          }
        } catch (_e) {
          contentBase64 = null;
        }

        if (!contentBase64) return null;

        const out: any = {
          filename,
          content: contentBase64,
        };
        if (contentType) out.content_type = contentType;
        if (disposition) out.disposition = disposition;
        if (disposition) out.content_disposition = disposition;
        if (cid) out.cid = cid;
        if (contentId) out.content_id = contentId;
        return out;
      })
      .filter(Boolean);
  }

  private normalizeRecipients(to: string | string[]): string[] {
    const list = Array.isArray(to) ? to : [to];
    const cleaned = list
      .flatMap((value) => String(value || '').split(','))
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => this.isValidEmailAddress(value));
    return Array.from(new Set(cleaned));
  }

  private isValidEmailAddress(value: string): boolean {
    // Accepts plain email or "Name <email@domain.com>".
    const simple = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const named = /^.+<\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*>$/;
    return simple.test(value) || named.test(value);
  }

  async sendRepairStatusUpdate(options: { to: string; customerName: string; orderCode: string; status: string; date: string | Date; }) {
    const subject = `Update on your service order #${options.orderCode}`;
    const dateLabel = this.formatDateTimeLabel(options.date);
    let html = `<p>Dear ${options.customerName},</p><p>Your service order #${options.orderCode} has changed to: <strong>${options.status}</strong> on ${dateLabel}</p>`;

    try {
      const tmplPath = resolveTemplate('repair-status-updated.hbs');
      if (tmplPath) {
        try {
          const handlebars = require('handlebars');
          const src = fs.readFileSync(tmplPath, 'utf8');
          const tpl = handlebars.compile(src);
          html = tpl({ customerName: options.customerName, orderCode: options.orderCode, status: options.status, date: dateLabel });
        } catch (e) {
          this.logger.debug('Failed to render repair-status template, using fallback HTML');
        }
      }

      const attachments: any[] = [];
      try {
        const logoPath = this.resolveStandardEmailHeader() || resolveUpload(['sopdf.jpg']);
        if (logoPath) {
          const content = fs.readFileSync(logoPath);
          attachments.push({
            filename: 'email-header.png',
            type: logoPath.endsWith('.png') ? 'image/png' : 'image/jpg',
            content: content.toString('base64'),
            content_type: logoPath.endsWith('.png') ? 'image/png' : 'image/jpg',
            cid: 'email-header@repairhub',
            content_id: 'email-header@repairhub',
            disposition: 'inline',
            contentDisposition: 'inline',
            content_disposition: 'inline',
          });
        }
      } catch (e) {
        this.logger.debug('No logo attachment for repair status email');
      }

      await this.sendEmail({ to: options.to, subject, html, attachments });
    } catch (error) {
      this.logger.error('EmailService.sendRepairStatusUpdate failed', error && error.message ? error.message : error);
      throw error;
    }
  }

  async sendServiceCompletionNotification(options: {
    to: string;
    customerName: string;
    orderCode: string;
    pdfBuffer: Buffer;
  }): Promise<void> {
    const subject = `Service Order ${options.orderCode} Completed`;
    const customerName = this.escapeHtml(options.customerName || 'Customer');
    const orderCode = this.escapeHtml(options.orderCode);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; padding: 0; background: #f4f5f7; font-family: Arial, Helvetica, sans-serif; color: #1f2933; }
    .wrapper { width: 100%; padding: 28px 0; }
    .container { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e7ec; }
    .header img { display: block; width: 100%; max-width: 640px; height: auto; }
    .content { padding: 32px 34px; font-size: 15px; line-height: 1.65; }
    h1 { margin: 0 0 22px; font-size: 22px; line-height: 1.25; color: #111827; }
    p { margin: 0 0 16px; }
    .contact { font-weight: 700; color: #111827; }
    .footer { padding: 18px 34px 26px; color: #667085; font-size: 12px; border-top: 1px solid #eef0f3; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header"><img src="cid:email-header@repairhub" alt="Miami Photography Center" /></div>
      <div class="content">
        <h1>Service Completion Notification</h1>
        <p>Dear ${customerName},</p>
        <p>Your service order ${orderCode} has been completed and the equipment has been successfully delivered/released.</p>
        <p>Attached you will find the final service documentation containing the completed work details, technical service summary and warranty information related to your order.</p>
        <p>We recommend keeping this document for your records and future service reference.</p>
        <p>If you have any questions regarding the completed service, warranty coverage or future maintenance recommendations, please contact us directly at:</p>
        <p class="contact">service@miamiphotographycenter.com</p>
        <p>Thank you for trusting Miami Photography Center.</p>
        <p>Best regards,<br />Miami Photography Center<br />Technical Service Department</p>
      </div>
      <div class="footer">This is an automated notification message.</div>
    </div>
  </div>
</body>
</html>`;

    const attachments: any[] = [];
    const headerAttachment = this.createStandardHeaderAttachment();
    if (headerAttachment) attachments.push(headerAttachment);
    attachments.push({
      filename: `service-order-${options.orderCode}.pdf`,
      content: options.pdfBuffer,
      contentType: 'application/pdf',
    });

    await this.sendEmail({ to: options.to, subject, html, attachments });
  }

  private createStandardHeaderAttachment(): any | null {
    try {
      const logoPath = this.resolveStandardEmailHeader() || resolveUpload(['sopdf.jpg', 'sopdf1.jpg', 'logo.png', 'logo.jpg']);
      if (!logoPath) return null;
      const contentType = logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return {
        filename: 'email-header.png',
        content: fs.readFileSync(logoPath),
        contentType,
        content_type: contentType,
        cid: 'email-header@repairhub',
        content_id: 'email-header@repairhub',
        disposition: 'inline',
        contentDisposition: 'inline',
        content_disposition: 'inline',
      };
    } catch (e) {
      this.logger.debug('No standard header attachment for email');
      return null;
    }
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatDateTimeLabel(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.businessTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find(item => item.type === type)?.value ?? '';

    return `${part('month')}/${part('day')}/${part('year')} ${part('hour')}:${part('minute')}`;
  }

  async sendDiagnosticNotification(opts: { to: string | string[]; customerName: string; orderCode: string; diagnostic: string; date: string | Date; forCenter?: boolean; }) {
    const templateName = opts.forCenter ? 'diagnostic-attention-center.hbs' : 'diagnostic-notification-customer.hbs';
    const subject = opts.forCenter ? `Attention required: Diagnostic added to order #${opts.orderCode}` : `Diagnostic added to your service order #${opts.orderCode}`;

    let html = `<p>${opts.forCenter ? 'Center team,' : 'Dear ' + opts.customerName},</p><p>Diagnostic: ${opts.diagnostic}</p><p>Date: ${typeof opts.date === 'string' ? opts.date : new Date(opts.date).toLocaleString()}</p>`;

    try {
      const tmplPath = resolveTemplate(templateName);
      if (tmplPath) {
        try {
          const handlebars = require('handlebars');
          const src = fs.readFileSync(tmplPath, 'utf8');
          const tpl = handlebars.compile(src);
          html = tpl({ customerName: opts.customerName, orderCode: opts.orderCode, diagnostic: opts.diagnostic, date: typeof opts.date === 'string' ? opts.date : new Date(opts.date).toLocaleString() });
        } catch (e) {
          this.logger.debug('Failed to render diagnostic template, using fallback HTML');
        }
      }

      const attachments: any[] = [];
      try {
        const logoPath = this.resolveStandardEmailHeader() || resolveUpload(['sopdf.jpg', 'sopdf1.jpg', 'logo.png', 'logo.jpg']);
        if (logoPath) {
          const content = fs.readFileSync(logoPath);
          attachments.push({ filename: 'email-header.png', content, cid: 'email-header@repairhub', content_id: 'email-header@repairhub', contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg', contentDisposition: 'inline', disposition: 'inline', content_disposition: 'inline' });
        }
      } catch (e) {
        this.logger.debug('No logo attachment for diagnostic email');
      }

      await this.sendEmail({ to: opts.to, subject, html, attachments });
    } catch (error) {
      this.logger.error('EmailService.sendDiagnosticNotification failed', error && error.message ? error.message : error);
      throw error;
    }
  }

  private resolveStandardEmailHeader(): string | null {
    const candidates = [
      path.join(__dirname, '..', '..', 'templates', 'emails', 'assets', 'email-header.png'),
      path.join(__dirname, '..', '..', '..', 'templates', 'emails', 'assets', 'email-header.png'),
      path.join(process.cwd(), 'src', 'templates', 'emails', 'assets', 'email-header.png'),
    ];

    return candidates.find(candidate => fs.existsSync(candidate)) || null;
  }

  // Método específico para empleados
  async sendEmployeeWelcomeEmail(
    employee: {
      email: string;
      firstName: string;
      lastName: string;
      employeeCode: string;
    },
    tempPassword: string,
    pin: string,
  ): Promise<void> {
    const subject = 'Welcome - Your Access Credentials';

    const html = this.getWelcomeEmailTemplate(
      employee.firstName,
      employee.lastName,
      employee.employeeCode,
      tempPassword,
      pin,
    );

    await this.sendEmail({ to: employee.email, subject, html });
  }

  private getWelcomeEmailTemplate(
    firstName: string,
    lastName: string,
    employeeCode: string,
    tempPassword: string,
    pin: string,
  ): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .credentials { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Our Company!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
      <p>Your account has been created. Here are your access credentials:</p>
      <div class="credentials">
        <h3>🔐 Your Credentials:</h3>
        <p><strong>Email:</strong> ${employeeCode}@yourcompany.com</p>
        <p><strong>Employee Code:</strong> ${employeeCode}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p><strong>Security PIN:</strong> ${pin}</p>
      </div>
      <p><strong>Important:</strong></p>
      <ul>
        <li>Store this information securely</li>
        <li>Change your password at first login</li>
        <li>The PIN will be used for security verifications</li>
      </ul>
      <p>You can access the system here: <a href="https://oceanspt.com/login" style="color: #007bff;">MPC System Login</a></p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>&copy; 2025 Miami Photography Center. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
}
