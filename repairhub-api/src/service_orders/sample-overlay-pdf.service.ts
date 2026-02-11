import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

@Injectable()
export class ServiceOrderSampleOverlayPdfService {
  private readonly logger = new Logger(ServiceOrderSampleOverlayPdfService.name);

  async generate(order: any): Promise<Buffer> {
    const samplePath = join(__dirname, 'templates', 'sample.pdf');
    let existingPdfBytes: Uint8Array;
    try {
      existingPdfBytes = readFileSync(samplePath);
    } catch (e) {
      // Fallback: during development/build the file may live under src/... instead of dist/...
      const altPath = join(process.cwd(), 'src', 'service_orders', 'templates', 'sample.pdf');
      try {
        this.logger.warn(`Sample PDF not found at ${samplePath}, trying ${altPath}`);
        existingPdfBytes = readFileSync(altPath);
      } catch (e2) {
        this.logger.error(`Sample PDF not found at ${samplePath} or ${altPath}`);
        throw new Error(`Sample PDF not found at ${samplePath} or ${altPath}`);
      }
    }

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 10;
    const leftX = 48;
    let y = height - 80; // start below top margin

    page.drawText(`Order Code: ${order.orderCode || ''}`, { x: leftX, y, size: fontSize, font: helvetica, color: rgb(0, 0, 0) });
    y -= 16;
    page.drawText(`Customer: ${order.customerName || ''}`, { x: leftX, y, size: fontSize, font: helvetica });
    y -= 16;
    const date = order.date instanceof Date ? order.date : new Date(order.date || Date.now());
    page.drawText(`Date: ${date.toLocaleDateString()}`, { x: leftX, y, size: fontSize, font: helvetica });
    y -= 16;
    page.drawText(`Device: ${order.device || ''}`, { x: leftX, y, size: fontSize, font: helvetica });

    // Financials on right side
    const rightX = width - 200;
    let ry = height - 140;
    page.drawText(`Price: $${(Number(order.price) || 0).toFixed(2)}`, { x: rightX, y: ry, size: fontSize, font: helvetica });
    ry -= 14;
    page.drawText(`Tax: $${(Number(order.tax) || 0).toFixed(2)}`, { x: rightX, y: ry, size: fontSize, font: helvetica });
    ry -= 14;
    page.drawText(`Discount: $${(Number(order.discount) || 0).toFixed(2)}`, { x: rightX, y: ry, size: fontSize, font: helvetica });
    ry -= 14;
    const total = Number(order.total) || (Number(order.price) - Number(order.discount) + (Number(order.price) * Number(order.tax) / 100)) || 0;
    page.drawText(`Total: $${total.toFixed(2)}`, { x: rightX, y: ry, size: fontSize + 1, font: helvetica });

    // Optionally place terms (small) at bottom area
    const terms = (order.terms || '').toString();
    if (terms) {
      const termsFontSize = 8;
      const termsY = 120;
      const wrapped = this.wrapText(terms, 80);
      let ty = termsY + (wrapped.length * termsFontSize) / 2;
      for (const line of wrapped) {
        page.drawText(line, { x: leftX, y: ty, size: termsFontSize, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
        ty -= termsFontSize + 2;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private wrapText(text: string, maxChars: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > maxChars) {
        lines.push(current.trim());
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) lines.push(current.trim());
    return lines;
  }
}
