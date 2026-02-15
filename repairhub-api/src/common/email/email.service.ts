import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { resolveUpload, resolveTemplate } from '../asset-utils';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
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
      .then(() => this.logger.log('transporter verified'))
      .catch((err) => this.logger.warn('transporter verification failed: ' + (err && err.message)));
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const fromEmail = this.configService.get('FROM_EMAIL') || this.configService.get('EMAIL_FROM') || 'system@localhost';
    const fromName = this.configService.get('FROM_NAME') || this.configService.get('EMAIL_FROM_NAME') || '';
    const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const mailOptions: nodemailer.SendMailOptions = {
      from: fromHeader,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${options.to} subject=${options.subject}`);
    } catch (err) {
      this.logger.error('Failed to send email', err && err.message ? err.message : err);
      throw err;
    }
  }

  async sendRepairStatusUpdate(options: { to: string; customerName: string; orderCode: string; status: string; date: string | Date; }) {
    const subject = `Update on your service order #${options.orderCode}`;
    let html = `<p>Dear ${options.customerName},</p><p>Your service order #${options.orderCode} has changed to: <strong>${options.status}</strong> on ${typeof options.date === 'string' ? options.date : new Date(options.date).toLocaleString()}</p>`;

    try {
      const tmplPath = resolveTemplate('repair-status-updated.hbs');
      if (tmplPath) {
        try {
          const handlebars = require('handlebars');
          const src = fs.readFileSync(tmplPath, 'utf8');
          const tpl = handlebars.compile(src);
          html = tpl({ customerName: options.customerName, orderCode: options.orderCode, status: options.status, date: typeof options.date === 'string' ? options.date : new Date(options.date).toLocaleString() });
        } catch (e) {
          this.logger.debug('Failed to render repair-status template, using fallback HTML');
        }
      }

      const attachments: any[] = [];
      try {
        const logoPath = resolveUpload(['sopdf1.jpg', 'logo.png', 'logo.jpg']);
        if (logoPath) {
          const content = fs.readFileSync(logoPath);
          attachments.push({
            filename: path.basename(logoPath),
            content,
            cid: 'logo@repairhub',
            content_id: 'logo@repairhub',
            contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg',
            contentDisposition: 'inline',
            disposition: 'inline',
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
        const logoPath = resolveUpload(['sopdf1.jpg', 'logo.png', 'logo.jpg']);
        if (logoPath) {
          const content = fs.readFileSync(logoPath);
          attachments.push({ filename: path.basename(logoPath), content, cid: 'logo@repairhub', content_id: 'logo@repairhub', contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg', contentDisposition: 'inline', disposition: 'inline' });
        }
      } catch (e) {
        this.logger.debug('No logo attachment for diagnostic email');
      }

      await this.sendEmail({ to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to, subject, html, attachments });
    } catch (error) {
      this.logger.error('EmailService.sendDiagnosticNotification failed', error && error.message ? error.message : error);
      throw error;
    }
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