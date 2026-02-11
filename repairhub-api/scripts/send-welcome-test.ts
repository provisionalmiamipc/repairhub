import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/common/email.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const emailService = app.get(EmailService);

  try {
    await emailService.sendWelcomeEmail({
      to: process.env.TEST_EMAIL || 'test@example.com',
      fullName: 'Test User',
      employeeCode: 'TST123',
      pin: '1234',
      tempPassword: 'TempPass123!'
    } as any);
    console.log('Test email sent (or queued)');
  } catch (err) {
    console.error('Test email failed:', err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

run();
