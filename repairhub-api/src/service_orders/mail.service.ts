import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { resolveUpload, resolveTemplate } from '../common/asset-utils';
import * as path from 'path';
import * as fs from 'fs';


@Injectable()
export class ServiceOrderMailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOrderCreatedMail(order: any , pdfBuffer: Buffer) {
    try {
      // If RESEND_API_KEY is present, use Resend HTTP API (works from Railway)
      const resendKey = process.env.RESEND_API_KEY;
      const handlebars = require('handlebars');

      // Resolve logo once so both Resend and SMTP flows can use it
      let logoPath: string | null = null;
      let logoAttachment: any = null;
      try {
        const p = resolveUpload(['sopdf1.jpg']);
        if (p) {
          logoPath = p;
          const logo = fs.readFileSync(p);
          logoAttachment = {
            filename: path.basename(p),
              // include both content_type and cid so both Resend and SMTP handle inline
              type: p.endsWith('.png') ? 'image/png' : 'image/jpg',
              content: logo.toString('base64'),
              content_type: p.endsWith('.png') ? 'image/png' : 'image/jpg',
              cid: 'logo@repairhub',
              content_id: 'logo@repairhub',
              disposition: 'inline',
          };
        }
      } catch (e) {
        // ignore
      }

      if (resendKey) {

        // Try to load the same template used by Nest Mailer so Resend sends the rendered HTML
        const context = {
          customerName: order.customerName,
          orderCode: order.orderCode,
          APP_URL: process.env.APP_URL || '',
        };

        let htmlBody = `<p>Hello ${order.customerName},</p><p>Please find attached your service order <strong>#${order.orderCode}</strong>.</p>`;
        let usedTemplate: string | null = null;
        const tmplPath = resolveTemplate('service-order-created.hbs');
        if (tmplPath) {
          try {
            const src = fs.readFileSync(tmplPath, 'utf8');
            const tpl = handlebars.compile(src);
            htmlBody = tpl(context);
            usedTemplate = tmplPath;
          } catch (e) {
            // fallback to default htmlBody
          }
        }

        // If a logo exists, `logoAttachment` was prepared above and will be used

        // template selection and logo presence determined

        // Dump PDF locally for inspection only when DEBUG_DUMP_PDF=1
        try {
          if (process.env.DEBUG_DUMP_PDF === '1') {
            const dumpPath = `/tmp/service-order-${order.orderCode}.pdf`;
            fs.writeFileSync(dumpPath, pdfBuffer);
            fs.writeFileSync(`${dumpPath}.base64`, pdfBuffer.toString('base64'));
          } else {
            // skip dumping in normal flow to reduce IO and latency
          }
        } catch (e) {
          console.error('ServiceOrderMailService: failed to dump pdf to /tmp', e);
        }
        // (No disk dumps in normal flow) — HTML kept in memory and sent via API

        // Validaciones para Resend: adjuntos deben ser Base64 y no superar 10MB
        const MAX_ATTACHMENT_BYTES = parseInt(process.env.RESEND_MAX_ATTACHMENT_BYTES || String(10 * 1024 * 1024), 10);
        if (!pdfBuffer) {
          throw new Error('PDF buffer is empty or invalid');
        }

        // Aceptar Buffer o TypedArray/Uint8Array y normalizar a Buffer
        let pdfBuf: Buffer;
        if (Buffer.isBuffer(pdfBuffer)) {
          pdfBuf = pdfBuffer;
        } else {
          try {
            pdfBuf = Buffer.from(pdfBuffer);
          } catch (e) {
            throw new Error('PDF buffer is empty or invalid');
          }
        }

        if (pdfBuf.length === 0) {
          throw new Error('PDF buffer is empty or invalid');
        }
        if (pdfBuf.length > MAX_ATTACHMENT_BYTES) {
          console.error('ServiceOrderMailService: PDF too large for Resend', { size: pdfBuf.length, max: MAX_ATTACHMENT_BYTES });
          throw new Error(`PDF exceeds maximum allowed size for Resend: ${pdfBuf.length} bytes`);
        }

        const pdfContentBase64 = pdfBuf.toString('base64');

        // Ensure logo content (if present) is Base64 string
        if (logoAttachment && logoAttachment.content && Buffer.isBuffer(logoAttachment.content)) {
          logoAttachment.content = logoAttachment.content.toString('base64');
        }

        const fromEmail = process.env.FROM_EMAIL || 'system@localhost';
        const fromName = process.env.FROM_NAME || '';
        const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        const payload: any = {
          from: fromHeader,
          to: order.customerEmail,
          subject: `Service Order #${order.orderCode} Created`,
          html: htmlBody,
          // attachments: include PDF and optionally the logo as inline attachment
          attachments: [
            // logo first so clients can render it inline via CID
            ...(logoAttachment ? [logoAttachment] : []),
            {
              filename: `service-order-${order.orderCode}.pdf`,
              content: pdfContentBase64,
              content_type: 'application/pdf',
            },
          ],
        };

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text().catch(() => '');
        let body: any = null;
        try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
        if (!res.ok) {
          const msg = (body && (body.error || body.message)) || (typeof body === 'string' ? body : JSON.stringify(body));
          console.error('Resend API error detail', { status: res.status, msg });
          throw new Error(`Resend API error: ${res.status} - ${msg}`);
        }
        return body;
      }

      // Fallback to existing SMTP mailer (Nest Mailer)
      const fromEmail = process.env.FROM_EMAIL || 'system@localhost';
      const fromName = process.env.FROM_NAME || '';
      const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      const info = await this.mailerService.sendMail({
        from: fromHeader,
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
          // Attach logo if present
          ...(logoPath ? [{ filename: path.basename(logoPath), path: logoPath, cid: 'logo@repairhub', contentType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg' }] : []),
        ],
      });
      // sent via SMTP fallback
      return info;
    } catch (err) {
      console.error('ServiceOrderMailService: failed to send order created mail', { to: order.customerEmail, orderCode: order.orderCode, err });
      throw err;
    }
  }
}
