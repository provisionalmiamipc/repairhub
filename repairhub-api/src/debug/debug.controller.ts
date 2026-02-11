import { Controller, Post, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Controller('_debug')
export class DebugController {
  private readonly logger = new Logger(DebugController.name);
  constructor(private readonly mailer: MailerService, private readonly config: ConfigService) {}

  @Post('send-test-mail')
  async sendTestMail() {
    const to = this.config.get<string>('DEBUG_TEST_EMAIL') || this.config.get<string>('FROM_EMAIL');
    if (!to) return { ok: false, error: 'No DEBUG_TEST_EMAIL or FROM_EMAIL configured' };

    try {
      const info = await this.mailer.sendMail({
        to,
        subject: 'RepairHub test mail from _debug endpoint',
        text: 'This is a test email triggered from the debug endpoint.',
      });
      this.logger.log('Debug test mail result: ' + JSON.stringify(info));
      return { ok: true, info };
    } catch (err: any) {
      this.logger.error('Debug test mail failed', err);
      return { ok: false, error: err?.message || err };
    }
  }
}
