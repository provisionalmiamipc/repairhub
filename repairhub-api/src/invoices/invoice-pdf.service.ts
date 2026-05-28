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
    const contentBottom = 720;

    this.drawHeader(doc, pageWidth, left, black, yellow);

    const centerLines = [
      'Miami Photography Center. LLC',      
      '3911 SW 27th St, West Park, 33023, FL',
      'service@miamiphotographycenter.com',
      '+1 (786) 763-2091',
      'www.miamiphotographycenter.com',
    ];

    doc.fillColor(black).font('Helvetica-Bold').fontSize(10.5);
    let y = 72;
    centerLines.forEach((line, index) => {
      doc
        .font('Helvetica-Bold')
        .text(line, 330, y, { width: 220, align: 'right' });
      y += index === centerLines.length - 1 ? 17 : 13;
    });
    y = 160;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Invoice No. ${invoice.invoiceNumber}`, 330, y, { width: 220, align: 'right' });
    y += 14;
    doc.text(`Date: ${this.formatDate(invoice.issueDate)}`, 330, y, { width: 220, align: 'right' });

    let bodyY = 165;
    doc.fontSize(11).fillColor(black);
    this.labelValue(doc, 'Customer:', this.billToName(invoice), left, bodyY);
    bodyY += 15;
    this.labelValue(doc, 'Address:', invoice.billToAddress || invoice.customer?.city || '', left, bodyY);
    bodyY += 15;
    this.labelValue(doc, 'Contact:', this.billToContact(invoice), left, bodyY);
    bodyY += 15;
    this.labelValue(doc, 'Via:', invoice.via || 'Workshop', left, bodyY);

    let tableY = 245;
    this.drawServicesHeader(doc, left, tableY);

    let rowY = tableY + 28;
    const items = [...(invoice.items || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    items.forEach((item) => {
      const description = item.description || '';
      const rowHeight = Math.max(
        16,
        doc.font('Helvetica-Bold').fontSize(10.5).heightOfString(description, { width: 360 }) + 4,
      );

      if (rowY + rowHeight > contentBottom) {
        this.drawFooter(doc, pageWidth);
        doc.addPage();
        this.drawHeader(doc, pageWidth, left, black, yellow);
        tableY = 165;
        this.drawServicesHeader(doc, left, tableY);
        rowY = tableY + 28;
      }

      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(black).text(description, left, rowY, { width: 360 });
      doc.font('Helvetica').text(this.money(item.lineTotal), 470, rowY, { width: 80, align: 'right' });
      rowY += rowHeight;
    });

    let summaryY = Math.max(rowY + 34, 345);
    const lowerContentHeight = 310;
    if (summaryY + lowerContentHeight > contentBottom) {
      this.drawFooter(doc, pageWidth);
      doc.addPage();
      this.drawHeader(doc, pageWidth, left, black, yellow);
      summaryY = 165;
    }

    const summaryEndY = this.drawServiceSummary(doc, invoice, left, summaryY, black);
    const totalsEndY = this.drawTotals(doc, invoice, right - 120, summaryY);
    const paymentY = Math.max(summaryEndY + 20, totalsEndY + 18);
    const paymentEndY = this.drawPaymentDetails(doc, invoice, left, paymentY);
    let termsY = paymentEndY + 26;

    if (termsY + 110 > contentBottom) {
      this.drawFooter(doc, pageWidth);
      doc.addPage();
      this.drawHeader(doc, pageWidth, left, black, yellow);
      termsY = 165;
    }

    this.drawTerms(doc, invoice, left, termsY, contentBottom, pageWidth, black, yellow);
    this.drawFooter(doc, pageWidth);
  }

  private drawHeader(doc: any, pageWidth: number, left: number, black: string, yellow: string) {
    if (!this.drawHeaderImage(doc, pageWidth)) {
      doc.rect(0, 38, pageWidth, 103).fill(yellow);
      this.drawLogo(doc, left, 68);
    }
    doc.fillColor(black);
  }

  private drawServicesHeader(doc: any, left: number, y: number) {
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#221F1F').text('SERVICES', left, y);
    doc.text('PRICE', 470, y, { width: 80, align: 'right' });
  }

  private drawFooter(doc: any, pageWidth: number) {
    if (!this.drawFooterImage(doc, pageWidth)) {
      this.drawFooterMark(doc, 450, 760);
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
      doc.image(fullMark, x, y + 10, { width: 80 });
      return;
    }

    const mark = this.assetPath('invoice-mark.png');
    doc.font('Helvetica-Bold').fontSize(36).fillColor('#000000').text('mpc', x, y);
    if (mark) doc.image(mark, x + 54, y + 8, { width: 44 });
  }

  private drawServiceSummary(doc: any, invoice: Invoice, x: number, y: number, black: string): number {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(black).text('Service Summary:', x, y);
    let bulletY = y + 16;
    this.summaryLines(invoice).forEach((line) => {
      const lineHeight = doc.font('Helvetica-Bold').fontSize(8.8).heightOfString(line, { width: 390, lineGap: 1 });
      doc.circle(x + 18, bulletY + 4, 1.8).fill(black);
      doc.font('Helvetica-Bold').fontSize(8.8).fillColor(black).text(line, x + 28, bulletY, {
        width: 390,
        lineGap: 1,
      });
      bulletY += Math.max(14, lineHeight + 4);
    });
    return bulletY;
  }

  private drawTotals(doc: any, invoice: Invoice, x: number, y: number): number {
    doc.rect(x, y, 133, 2).fill('#221F1F');
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

    return rowY;
  }

  private drawPaymentDetails(doc: any, invoice: Invoice, x: number, y: number): number {
    const paymentMethod = invoice.paymentType?.type;
    const instructions = invoice.paymentInstructions?.trim();
    if (!paymentMethod && !instructions) return y;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#221F1F').text('Payment method:', x, y, { continued: true });
    doc.font('Helvetica').text(` ${paymentMethod || 'N/A'}`);

    if (instructions) {
      doc.font('Helvetica').fontSize(8.5).text(instructions, x, y + 14, { width: 360, lineGap: 1 });
      return y + 14 + doc.heightOfString(instructions, { width: 360, lineGap: 1 });
    }

    return y + 14;
  }

  private drawTerms(
    doc: any,
    invoice: Invoice,
    x: number,
    y: number,
    contentBottom: number,
    pageWidth: number,
    black: string,
    yellow: string,
  ) {
    const drawTitle = () => {
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000').text('TERMS & CONDITIONS', x, y);
      y += 22;
    };

    drawTitle();
    const terms = this.termsLines(invoice);
    const bulletX = x + 4;
    const textX = x + 18;
    const textWidth = 506;
    terms.forEach((term, index) => {
      doc.font(index === terms.length - 1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('#000000');
      const height = doc.heightOfString(term, { width: textWidth, lineGap: 1 });

      if (y + height + 4 > contentBottom) {
        this.drawFooter(doc, pageWidth);
        doc.addPage();
        this.drawHeader(doc, pageWidth, x, black, yellow);
        y = 165;
        drawTitle();
      }

      doc.text('-', bulletX, y, { width: 8, align: 'left' });
      doc.text(term, textX, y, { width: textWidth, align: 'left', lineGap: 1 });
      y += height + 4;
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
