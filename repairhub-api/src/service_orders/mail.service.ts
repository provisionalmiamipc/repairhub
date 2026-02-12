import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';


@Injectable()
export class ServiceOrderMailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOrderCreatedMail(order: any , pdfBuffer: Buffer) {
    try {
      // If RESEND_API_KEY is present, use Resend HTTP API (works from Railway)
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const fs = require('fs');
        const path = require('path');
        const handlebars = require('handlebars');

        // Try to load the same template used by Nest Mailer so Resend sends the rendered HTML
        const tmplCandidates = [
          path.join(__dirname, '..', 'templates', 'emails', 'service-order-created.hbs'),
          path.join(process.cwd(), 'src', 'templates', 'emails', 'service-order-created.hbs'),
          path.join(process.cwd(), 'templates', 'emails', 'service-order-created.hbs'),
        ];

        const context = {
          customerName: order.customerName,
          orderCode: order.orderCode,
          APP_URL: process.env.APP_URL || '',
        };

        let htmlBody = `<p>Hola ${order.customerName},</p><p>Adjunto tu orden de servicio <strong>#${order.orderCode}</strong>.</p>`;
        let usedTemplate: string | null = null;
        for (const c of tmplCandidates) {
          try {
            if (fs.existsSync(c)) {
              const src = fs.readFileSync(c, 'utf8');
              const tpl = handlebars.compile(src);
              htmlBody = tpl(context);
              usedTemplate = c;
              break;
            }
          } catch (e) {
            // continue to next candidate
          }
        }

        // If a logo exists, attach it as an inline attachment with content_id so
        // it can be referenced from the HTML via the CID `logo@repairhub`.
        // Do NOT replace the CID in the HTML so clients that support inline
        // attachments can render it from the attachment.
        let logoPath: string | null = null;
        let logoAttachment: any = null;
        try {
          const candidate = path.join(process.cwd(), 'src', 'uploads', 'logo.png');
          if (fs.existsSync(candidate)) {
            logoPath = candidate;
            const logo = fs.readFileSync(candidate);
            logoAttachment = {
              filename: 'logo.png',
              type: 'image/png',
              content: logo.toString('base64'),
              content_id: 'logo@repairhub',
              disposition: 'inline',
            };
          }
        } catch (e) {
          // ignore
        }

        // template selection and logo presence determined

        // Dump PDF locally for inspection only when DEBUG_DUMP_PDF=1
        try {
          if (process.env.DEBUG_DUMP_PDF === '1') {
            const dumpPath = `/tmp/service-order-${order.orderCode}.pdf`;
            fs.writeFileSync(dumpPath, pdfBuffer);
            fs.writeFileSync(`${dumpPath}.base64`, pdfBuffer.toString('base64'));
            console.log('ServiceOrderMailService: dumped PDF to', dumpPath);
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
          {
            filename: 'logo.png',
            path: require('path').join(process.cwd(), 'src', 'uploads', 'logo.png'),
            cid: 'logo@repairhub',
            contentType: 'image/png',
          }
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
