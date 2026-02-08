import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

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

    const subject = `Bienvenido a RepairHub`;

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
        },
      });

      this.logger.log(`Welcome email queued/sent to ${options.to}`);
    } catch (error) {
      this.logger.error('Error sending welcome email', error as any);
    }
  }
}
