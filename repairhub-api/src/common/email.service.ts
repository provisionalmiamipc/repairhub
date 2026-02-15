import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { resolveUpload } from './asset-utils';
import * as fs from 'fs';
import * as path from 'path';

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
          fullName: options.fullName ?? 'usuario',
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
    const subject = `Actualización de estado de su orden #${options.orderCode}`;
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
}
