import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { PassThrough } from 'stream';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicePdfService {
  async generate(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const stream = new PassThrough();
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);

      this.drawInvoice(doc, invoice);
      doc.end();
    });
  }

  private drawInvoice(doc: any, invoice: Invoice) {
    const black = '#221F1F';
    const yellow = '#FFFF00';
    const pageWidth = doc.page.width;
    const left = 56;
    const right = 550;

    if (!this.drawHeaderImage(doc, pageWidth)) {
      doc.rect(0, 38, pageWidth, 103).fill(yellow);
      this.drawLogo(doc, left, 68);
    }

    const centerLines = [
      'Miami Photography Center LLC',
      'miamipcenter@gmail.com',
      '3911 sw 27th St, West Park 33023, FL',
      '+1 (786) 763-2091',
    ];

    doc.fillColor(black).font('Helvetica-Bold').fontSize(10.5);
    let y = 160;
    centerLines.forEach((line, index) => {
      doc
        .font('Helvetica-Bold')
        .text(line, 330, y, { width: 220, align: 'right' });
      y += index === centerLines.length - 1 ? 17 : 13;
    });
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Invoice No. ${invoice.invoiceNumber} / ${this.formatDate(invoice.issueDate)}`, 330, y + 4, { width: 220, align: 'right' });

    let bodyY = 265;
    doc.fontSize(11).fillColor(black);
    this.labelValue(doc, 'Customer:', this.billToName(invoice), left, bodyY);
    bodyY += 15;
    this.labelValue(doc, 'Address:', invoice.billToAddress || invoice.customer?.city || '', left, bodyY);
    bodyY += 15;
    this.labelValue(doc, 'O:', this.billToContact(invoice), left, bodyY);
    bodyY += 15;
    this.labelValue(doc, 'Via:', invoice.via || 'Workshop', left, bodyY);

    const tableY = 345;
    doc.font('Helvetica-Bold').fontSize(16).text('SERVICES', left, tableY);
    doc.text('PRICE', 470, tableY, { width: 80, align: 'right' });

    let rowY = tableY + 28;
    const items = [...(invoice.items || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    items.forEach((item) => {
      doc.font('Helvetica-Bold').fontSize(10.5).text(item.description || '', left, rowY, { width: 360 });
      doc.font('Helvetica').text(this.money(item.lineTotal), 470, rowY, { width: 80, align: 'right' });
      rowY += 16;
    });

    const summaryY = Math.max(rowY + 38, 445);
    doc.font('Helvetica-Bold').fontSize(10).text('Service Summary:', left, summaryY);
    let bulletY = summaryY + 16;
    this.summaryLines(invoice).forEach((line) => {
      doc.circle(left + 18, bulletY + 4, 1.8).fill(black);
      doc.font('Helvetica-Bold').fontSize(8.8).text(line, left + 28, bulletY, { width: 390 });
      bulletY += 14;
    });

    this.drawTotals(doc, invoice, right - 120, 568);
    this.drawTerms(doc, invoice, left, 675);
    if (!this.drawFooterImage(doc, pageWidth)) {
      this.drawFooterMark(doc, 448, 742);
    }
  }

  private drawHeaderImage(doc: any, pageWidth: number): boolean {
    const header = this.assetPathAny(['invoice-header.png', 'invoice-header.jpg', 'invoice-header.jpeg']);
    if (!header) return false;
    doc.image(header, 0, 38, { width: pageWidth });
    return true;
  }

  private drawFooterImage(doc: any, pageWidth: number): boolean {
    const footer = this.assetPathAny(['invoice-footer.png', 'invoice-footer.jpg', 'invoice-footer.jpeg']);
    if (!footer) return false;
    doc.image(footer, 0, 735, { width: pageWidth });
    return true;
  }

  private drawLogo(doc: any, x: number, y: number) {
    const logoText = this.assetPathAny(['invoice-logo-text-trimmed.png', 'invoice-logo-text.png']);
    if (logoText) {
      doc.image(logoText, x, y - 31, { width: 233 });
      return;
    }

    doc.font('Helvetica-Bold').fontSize(30).fillColor('#000000').text('miami', x, y);
    doc.font('Helvetica-Bold').fontSize(21).text('Photography', x, y + 38);
    doc.font('Helvetica-Oblique').fontSize(20).text('center', x, y + 62);
  }

  private drawFooterMark(doc: any, x: number, y: number) {
    const fullMark = this.assetPathAny(['invoice-mark-full-trimmed.png', 'invoice-mark-full.png']);
    if (fullMark) {
      doc.image(fullMark, x, y + 10, { width: 120 });
      return;
    }

    const mark = this.assetPath('invoice-mark.png');
    doc.font('Helvetica-Bold').fontSize(48).fillColor('#000000').text('mpc', x, y);
    if (mark) doc.image(mark, x + 70, y + 8, { width: 58 });
  }

  private drawTotals(doc: any, invoice: Invoice, x: number, y: number) {
    doc.rect(x, y, 112, 3).fill('#221F1F');
    const rows = [
      ['SUBTOTAL', Number(invoice.subtotal || 0), false],
      [`TAX ${this.percent(invoice.tax)}%`, this.taxAmount(invoice), false],
      ['TOTAL', Number(invoice.total || 0), true],
    ] as const;

    let rowY = y + 12;
    rows.forEach(([label, value, bold]) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica-Bold').fontSize(10).fillColor('#221F1F').text(label, x, rowY, { width: 62 });
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').text(this.money(value, true), x + 62, rowY, { width: 72, align: 'right' });
      rowY += 27;
    });
  }

  private drawTerms(doc: any, invoice: Invoice, x: number, y: number) {
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000').text('TERM & CONDITION', x, y);
    const terms = this.termsLines(invoice);
    let termY = y + 22;
    terms.forEach((term, index) => {
      doc.font(index === terms.length - 1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('#000000');
      doc.text(`·  ${term}`, x + 4, termY, { width: 520, align: 'left', lineGap: 1 });
      termY += doc.heightOfString(`·  ${term}`, { width: 520, lineGap: 1 }) + 2;
    });
  }

  private labelValue(doc: any, label: string, value: string, x: number, y: number) {
    doc.font('Helvetica-Bold').text(label, x, y, { continued: true });
    doc.font('Helvetica').text(` ${value || ''}`);
  }

  private billToName(invoice: Invoice): string {
    return invoice.billToName || [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(' ');
  }

  private billToContact(invoice: Invoice): string {
    return invoice.billToContact || [invoice.customer?.phone, invoice.customer?.email].filter(Boolean).join(' | ');
  }

  private summaryLines(invoice: Invoice): string[] {
    if (invoice.serviceSummary?.trim()) {
      return invoice.serviceSummary.split('\n').map((line) => line.trim()).filter(Boolean);
    }
    return (invoice.items || []).map((item) => item.description).filter(Boolean);
  }

  private termsLines(invoice: Invoice): string[] {
    if (invoice.terms?.trim()) {
      return invoice.terms.split('\n').map((line) => line.trim()).filter(Boolean);
    }
    return [
      'The service warranty covers the proper execution of maintenance and cleaning, ensuring optimal equipment performance under normal usage conditions.',
      'Equipment delivery will be arranged within an agreed-upon timeframe following service acceptance.',
      'Miami Photography Center is not responsible for the care, storage or deterioration of the equipment that is not claimed after 60 days following notification of service completion.',
    ];
  }

  private formatDate(value: string | Date): string {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [year, month, day] = value.slice(0, 10).split('-').map(Number);
      return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '');
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  }

  private money(value: number, spaceAfterDollar = false): string {
    const formatted = Number(value || 0).toFixed(2);
    return spaceAfterDollar ? `$ ${formatted}` : `$${formatted}`;
  }

  private taxAmount(invoice: Invoice): number {
    return Number(invoice.subtotal || 0) * (Number(invoice.tax || 0) / 100);
  }

  private percent(value: number): string {
    return Number(value || 0).toFixed(2).replace(/\.00$/, '');
  }

  private assetPath(file: string): string | null {
    const candidates = [
      join(__dirname, 'assets', file),
      join(__dirname, '..', 'invoices', 'assets', file),
      join(process.cwd(), 'src', 'invoices', 'assets', file),
    ];
    return candidates.find((candidate) => existsSync(candidate)) || null;
  }

  private assetPathAny(files: string[]): string | null {
    for (const file of files) {
      const found = this.assetPath(file);
      if (found) return found;
    }
    return null;
  }
}
