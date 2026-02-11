import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';


@Injectable()
export class ServiceOrderMailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOrderCreatedMail(order: any , pdfBuffer: Buffer) {
    try {
      const info = await this.mailerService.sendMail({
        to: order.customerEmail,
        subject: `Service Order #${order.orderCode} Created`,
        template: 'service-order-created',
        context: {
          customerName: order.customerName,
          orderCode: order.orderCode,
        },
        attachments: [
          {
            filename: `service-order-${order.orderCode}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
          {
            filename: 'logo.png',
            path: require('path').join(process.cwd(), 'src', 'uploads', 'logo.png'),
            cid: 'logo@repairhub',
            contentType: 'image/png',
          }
        ],
      });
      console.log('ServiceOrderMailService: sendMail result', { to: order.customerEmail, orderCode: order.orderCode, result: info });
      return info;
    } catch (err) {
      console.error('ServiceOrderMailService: failed to send order created mail', { to: order.customerEmail, orderCode: order.orderCode, err });
      throw err;
    }
  }
}
