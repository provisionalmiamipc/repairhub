import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { resolveUpload } from '../common/asset-utils';


@Injectable()
export class RepairPdfService {
  /**
   * Generates the repair details PDF
   * @param data - Repair data object
   * @param res - Express Response object (optional, for streaming)
   * @param outputPath - File path to save PDF (optional)
   */
  async generateRepairPdf(
    data: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document (Letter size: 612 x 792 points)
        const doc = new PDFDocument({
          size: 'letter',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Draw the document
        this.drawHeader(doc, data);
        this.drawSummarySection(doc, data);
        this.drawDeviceSection(doc, data);
        this.drawDefectivePartsSection(doc, data);
        this.drawNotesSection(doc, data);
        this.drawReceivedPartsSection(doc, data);

        // Add new page for notes
        //doc.addPage();
        this.drawDiagnosticsSection(doc, data);
        this.drawStatusHistorySection(doc, data);
        this.drawProductSummarySection(doc, data);

        //doc.addPage();
        this.drawTermsOrWarrantyPolicy(doc, data);
        this.drawServiceOrderImages(doc, data);

        // Finalize PDF
        doc.end();

        doc.on('finish', () => resolve());
        doc.on('error', (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates the repair PDF and returns it as a Buffer
   * (useful to attach to emails or return from APIs)
   */
  async generateRepairPdfBuffer(data: any): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'letter',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Draw content using the same helpers
        this.drawHeader(doc, data);
        this.drawSummarySection(doc, data);
        this.drawDeviceSection(doc, data);
        this.drawDefectivePartsSection(doc, data);
        this.drawNotesSection(doc, data);
        this.drawReceivedPartsSection(doc, data);

        // Add new page for the remaining sections.
        doc.addPage();
        this.drawDiagnosticsSection(doc, data);
        this.drawStatusHistorySection(doc, data);
        this.drawProductSummarySection(doc, data);

        doc.addPage();
        this.drawTermsOrWarrantyPolicy(doc, data);
        this.drawServiceOrderImages(doc, data);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private drawServiceOrderImages(doc: PDFDocument, data: any): void {
    const images = Array.isArray(data.serviceOrderImages) ? data.serviceOrderImages : [];
    if (!images.length) return;

    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const marginBottom = doc.page.margins.bottom;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const gap = 12;
    const columns = 2;
    const imageWidth = (contentWidth - gap) / columns;
    const imageHeight = 150;
    const titleHeight = 26;
    const rowHeight = imageHeight + 24;

    let yPos = doc.y + 30;
    if (yPos + titleHeight + rowHeight > pageHeight - marginBottom) {
      doc.addPage();
      yPos = doc.page.margins.top;
    }

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('SERVICE ORDER IMAGES', marginLeft, yPos);
    yPos += titleHeight;

    images.forEach((image: { originalName?: string; buffer: Buffer }, index: number) => {
      const column = index % columns;
      if (column === 0 && yPos + rowHeight > pageHeight - marginBottom) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      const xPos = marginLeft + column * (imageWidth + gap);
      try {
        doc.image(image.buffer, xPos, yPos, {
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center',
        });
        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#555555')
          .text(image.originalName || `Image ${index + 1}`, xPos, yPos + imageHeight + 4, {
            width: imageWidth,
            align: 'center',
            ellipsis: true,
          });
      } catch {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#777777')
          .text('Image unavailable', xPos, yPos + 60, {
            width: imageWidth,
            align: 'center',
          });
      }

      if (column === columns - 1 || index === images.length - 1) {
        yPos += rowHeight;
      }
    });

    doc.y = yPos;
  }

  private pageBottom(doc: PDFDocument): number {
    return doc.page.height - doc.page.margins.bottom;
  }

  private ensureSpace(doc: PDFDocument, requiredHeight: number): void {
    if (doc.y + requiredHeight > this.pageBottom(doc)) {
      doc.addPage();
    }
  }

  /**
   * Draw the header with logo and company info
   */
  private drawHeader(doc: PDFDocument, data: any): void {
    const pageWidth = doc.page.width;
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const black = '#221F1F';
    const yellow = '#FFFF00';

    if (!this.drawInvoiceHeaderImage(doc, pageWidth)) {
      doc.rect(0, 38, pageWidth, 103).fill(yellow);
      this.drawInvoiceLogo(doc, 56, 68);
    }

    const centerLines = [
      'Miami Photography Center. LLC',
      'www.miamiphotographycenter.com',
      '3911 SW 27th St, West Park, 33023, FL',
      'service@miamiphotographycenter.com',
      '+1 (786) 763-2091',
    ];

    doc.fillColor(black).font('Helvetica-Bold').fontSize(10.5);
    const centerLineHeight = 16;
    let headerTextY = 60;
    centerLines.forEach((line) => {
      doc
        .font('Helvetica-Bold')
        .text(line, 330, headerTextY, { width: 220, align: 'right' });
      headerTextY += centerLineHeight;
    });

    // DATE and REPAIR ID section
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DATE:', marginLeft, 180);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(data.date, marginLeft, 195);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('SERVICE ORDER', marginLeft + 150, 180);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(data.orderCode, marginLeft + 150, 195);

    // "Repair Details" title (right side)
    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Repair Details', marginLeft + 250, 175, {
        width: contentWidth - 250,
        align: 'right',
      });

    // Red line under header
    doc
      .strokeColor('#CC0000')
      .lineWidth(3)
      .moveTo(marginLeft, 225)
      .lineTo(pageWidth - marginRight, 225)
      .stroke();

    doc.y = 225;
  }

  private drawInvoiceHeaderImage(doc: PDFDocument, pageWidth: number): boolean {
    const header = this.invoiceAssetPathAny(['invoice-header.png', 'invoice-header.jpg', 'invoice-header.jpeg']);
    if (!header) return false;
    doc.image(header, 0, 38, { width: pageWidth });
    return true;
  }

  private drawInvoiceLogo(doc: PDFDocument, x: number, y: number): void {
    const logoText = this.invoiceAssetPathAny(['invoice-logo-text-trimmed.png', 'invoice-logo-text.png']);
    if (logoText) {
      doc.image(logoText, x, y - 31, { width: 233 });
      return;
    }

    const fallbackLogo = resolveUpload(['sopdf.jpg', 'sopdf.png', 'logo.png', 'logo.jpg']);
    if (fallbackLogo) {
      doc.image(fallbackLogo, x, y - 20, { width: 120 });
      return;
    }

    //doc.font('Helvetica-Bold').fontSize(30).fillColor('#000000').text('miami', x, y);
    //doc.font('Helvetica-Bold').fontSize(21).text('Photography', x, y + 38);
    //doc.font('Helvetica-Oblique').fontSize(20).text('center', x, y + 62);
  }

  private invoiceAssetPath(file: string): string | null {
    const candidates = [
      join(__dirname, '..', 'invoices', 'assets', file),
      join(__dirname, '..', '..', 'invoices', 'assets', file),
      join(process.cwd(), 'src', 'invoices', 'assets', file),
    ];
    return candidates.find((candidate) => existsSync(candidate)) || null;
  }

  private invoiceAssetPathAny(files: string[]): string | null {
    for (const file of files) {
      const found = this.invoiceAssetPath(file);
      if (found) return found;
    }
    return null;
  }

  /**
   * Draw SUMMARY section
   */
  private drawSummarySection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureSpace(doc, 88);
    let yPos = doc.y + 25;

    // SUMMARY title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('SUMMARY', marginLeft, yPos);

    yPos += 25;

    // Table header
    const tableTop = yPos;
    const colWidths = [contentWidth * 0.34, contentWidth * 0.36, contentWidth * 0.30];
    const headers = ['EMPLOYEE', 'CUSTOMER', 'STATUS'];

    // Header background
    doc
      .rect(marginLeft, tableTop, contentWidth, 25)
      .fill('#E8E8E8')
      .stroke();

    // Header text
    let xPos = marginLeft;
    headers.forEach((header, i) => {
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(header, xPos + 5, tableTop + 8, {
          width: colWidths[i] - 10,
          align: 'left',
        });
      xPos += colWidths[i];
    });

    yPos = tableTop + 25;

    // Table row data
    const rowData = [data.createdBy || '---', data.customerName || '---', data.lastrepairStatus?.status || '---'];

    // Row background
    //doc
    //.rect(marginLeft, yPos, contentWidth, 25);
    //.stroke();

    // Row text
    xPos = marginLeft;
    rowData.forEach((text, i) => {
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica')
        .text(text, xPos + 5, yPos + 8, {
          width: colWidths[i] - 10,
          align: 'left',
        });

      // Vertical lines
      /*if (i < rowData.length - 1) {
        doc
          .moveTo(xPos + colWidths[i], tableTop)
          .lineTo(xPos + colWidths[i], yPos + 25)
          .stroke();
      }*/
      xPos += colWidths[i];
    });

    doc.y = yPos + 25;
  }

  /**
   * Draw DEVICE section
   */
  private drawDeviceSection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureSpace(doc, 80);
    let yPos = doc.y + 25;

    // Table header
    const tableTop = yPos;
    const colWidths = [
      contentWidth * 0.20,
      contentWidth * 0.20,
      contentWidth * 0.20,
      contentWidth * 0.20,
      contentWidth * 0.20,
    ];
    const headers = ['DEVICE', 'BRAND', 'MODEL', 'SERIAL', 'ESTIMATED COST'];

    // Header background
    doc
      .rect(marginLeft, tableTop, contentWidth, 25)
      .fill('#E8E8E8');
    //.stroke();

    // Header text
    let xPos = marginLeft;
    headers.forEach((header, i) => {
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(header, xPos + 5, tableTop + 5, {
          width: colWidths[i] - 10,
          align: 'left',
        });
      xPos += colWidths[i];
    });

    yPos = tableTop + 25;

    // Row data
    const rowHeight = 42;
    //doc
    // .rect(marginLeft, yPos, contentWidth, rowHeight);
    //.stroke();

    // Device
    xPos = marginLeft;
    doc
      .fillColor('#000000')
      .fontSize(9)
      .font('Helvetica')
      .text(data.device, xPos + 5, yPos + 8, {
        width: colWidths[0] - 10,
      });

    // Vertical line
    xPos += colWidths[0];
    /*doc
      .moveTo(xPos, tableTop)
      .lineTo(xPos, yPos + rowHeight)
      .stroke();*/

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(data.brand, xPos + 5, yPos + 8, {
        width: colWidths[1] - 10,
      });

    // Vertical line
    xPos += colWidths[2];

    // Defective part
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(data.model, xPos + 5, yPos + 8, {
        width: colWidths[2] - 10,
      });

    // Vertical line
    xPos += colWidths[1];

    /*doc
      .moveTo(xPos, tableTop)
      .lineTo(xPos, yPos + rowHeight)
      .stroke();*/

    // IMEI
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(data.serial, xPos + 5, yPos + 8, {
        width: colWidths[3] - 10,
      });

    // Vertical line
    xPos += colWidths[3];
    /*doc
      .moveTo(xPos, tableTop)
      .lineTo(xPos, yPos + rowHeight)
      .stroke();*/

    // Cost
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`$ ${data.price}`, xPos + 5, yPos + 8, {
        width: colWidths[4] - 10,
      });

    doc.y = yPos + rowHeight;
  }

  /**
   * Draw DEFECTIVE / WORKING PARTS section
   */
  private drawDefectivePartsSection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;

    this.ensureSpace(doc, 72);
    let yPos = doc.y + 30;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DEFECTIVE PART', marginLeft, yPos);

    yPos += 25;

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000')
      .text(data.defectivePart || '---', marginLeft + 5, yPos, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 10,
      });

    doc.y = doc.y + 10;
  }

  /**
   * Draw RECEIVED PARTS section
   */
  private drawReceivedPartsSection(doc: PDFDocument, data: any): void {

    if (!data.receivedParts || data.receivedParts.length === 0) {
      return;
    }

    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureSpace(doc, 75);
    let yPos = doc.y + 25;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('RECEIVED PARTS', marginLeft, yPos);

    yPos += 20;

    // Table header
    const tableTop = yPos;
    const colWidths = [contentWidth * 0.5, contentWidth * 0.5];


    // Header background
    doc
      .rect(marginLeft, tableTop, contentWidth, 25)
      .fill('#E8E8E8')
      .stroke();

    // Table headers
    doc
      .fillColor('#000000')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('ACCESSORY', marginLeft + 5, tableTop + 8, {
        width: colWidths[0] - 10,
        align: 'left',
      })
      .text('OBSERVATIONS', marginLeft + colWidths[0] + 5, tableTop + 8, {
        width: colWidths[1] - 10,
        align: 'left',
      });

    yPos = tableTop + 25;

    // Table content
    data.receivedParts.forEach((part: any) => {
      if (yPos + 24 > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(part.accessory, marginLeft + 5, yPos + 8, {
          width: colWidths[0] - 10,
          align: 'left',
        })
        .text(part.observations || '', marginLeft + colWidths[0] + 5, yPos + 8, {
          width: colWidths[1] - 10,
          align: 'left',
        });

      yPos += 20;
    });

    doc.y = yPos;
  }

  /**
   * Draw STATUS HISTORY section
   */
  private drawStatusHistorySection(doc: PDFDocument, data: any): void {

    if (data.repairStatus.length > 1) {
      const marginLeft = doc.page.margins.left;
      const marginRight = doc.page.margins.right;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - marginLeft - marginRight;

      this.ensureSpace(doc, 75);
      let yPos = doc.y + 25;

      // Section title
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('STATUS HISTORY', marginLeft, yPos);

      yPos += 25;

      // Table header
      const tableTop = yPos;
      const colWidths = [contentWidth * 0.5, contentWidth * 0.5];
      const headers = ['DATE:', 'STATUS'];

      // Header background
      doc
        .rect(marginLeft, tableTop, contentWidth, 25)
        .fill('#E8E8E8')
        .stroke();

      // Header text
      let xPos = marginLeft;
      headers.forEach((header, i) => {
        doc
          .fillColor('#000000')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(header, xPos + 5, tableTop + 8, {
            width: colWidths[i] - 10,
            align: 'left',
          });
        xPos += colWidths[i];
      });

      yPos = tableTop + 25;

      // Status history rows
      data.repairStatus.forEach((status, index) => {
        if (yPos + 24 > this.pageBottom(doc)) {
          doc.addPage();
          yPos = doc.page.margins.top;
        }

        /*doc
          .rect(marginLeft, yPos, contentWidth, 25)
          .stroke();*/

        xPos = marginLeft;

        // Date
        doc
          .fillColor('#000000')
          .fontSize(9)
          .font('Helvetica')
          .text(status.date, xPos + 5, yPos + 8, {
            width: colWidths[0] - 10,
          });

        // Vertical line
        xPos += colWidths[0];
        /*
      doc
        .moveTo(xPos, tableTop)
        .lineTo(xPos, yPos + 25)
        .stroke();*/

        // Status
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(status.status, xPos + 5, yPos + 8, {
            width: colWidths[1] - 10,
          });

        yPos += 20;
      });

      doc.y = yPos;
    }
  }

  /**
   * Draw DIAGNOSTICS section
   */
  private drawDiagnosticsSection(doc: PDFDocument, data: any): void {
    if (!data.diagnostics || data.diagnostics.length === 0) {
      return;
    }

    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureSpace(doc, 75);
    let yPos = doc.y + 25;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DIAGNOSTICS', marginLeft, yPos);

    yPos += 25;

    // Table header
    const tableTop = yPos;
    const colWidths = [contentWidth * 0.8, contentWidth * 0.2];


    // Header background
    doc
      .rect(marginLeft, tableTop, contentWidth, 25)
      .fill('#E8E8E8')
      .stroke();

    // Table headers
    doc
      .fontSize(9)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('TITLE', marginLeft + 5, yPos + 8, {
        width: colWidths[0] - 10,
        align: 'left',
      })
      .text('DATE', marginLeft + colWidths[0] + 5, yPos + 8, {
        width: colWidths[1] - 10,
        align: 'left',
      });

    yPos += 25;

    // Table content
    data.diagnostics.forEach((diagnostic: any) => {
      if (yPos + 28 > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(diagnostic.title, marginLeft + 5, yPos + 8, {
          width: colWidths[0] - 10,
          align: 'left',
        })
        .text(diagnostic.date, marginLeft + colWidths[0] + 5, yPos + 8, {
          width: colWidths[1] - 10,
          align: 'left',
        });

      yPos += 20;
    });

    doc.y = yPos;
  }

  /**
   * Draw NOTES section (page 2)
   */
  private drawNotesSection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    const notes = [
      { type: 'Reception', note: data.noteReception || '---' },
      { type: 'Estimated', note: data.estimated || '---' },
    ];

    this.ensureSpace(doc, 90);
    let yPos = doc.y + 30;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('NOTES', marginLeft, yPos);

    yPos += 25;

    // Table header
    const tableTop = yPos;
    const colWidths = [
      contentWidth * 0.22,
      contentWidth * 0.78,
    ];
    const headers = ['NOTE', 'DESCRIPTION'];

    // Header background
    doc
      .rect(marginLeft, tableTop, contentWidth, 25)
      .fill('#E8E8E8')
      .stroke();

    // Header text
    let xPos = marginLeft;
    headers.forEach((header, i) => {
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(header, xPos + 5, tableTop + 8, {
          width: colWidths[i] - 10,
          align: 'left',
        });
      xPos += colWidths[i];
    });

    yPos = tableTop + 25;

    // Notes rows
    notes.forEach((note) => {
      const noteHeight = this.calculateTextHeight(doc, note.note, colWidths[1] - 10, 9);
      const rowHeight = Math.max(20, noteHeight + 16);
      if (yPos + rowHeight > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      /*doc
        .rect(marginLeft, yPos, contentWidth, rowHeight)
        .stroke();
        */
      xPos = marginLeft;

      // Date
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(note.type, xPos + 5, yPos + 8, {
          width: colWidths[0] - 10,
        });

      // Vertical line
      xPos += colWidths[0];
      /*
      doc
        .moveTo(xPos, yPos)
        .lineTo(xPos, yPos + rowHeight)
        .stroke();*/

      // Employee
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(note.note, xPos + 5, yPos + 8, {
          width: colWidths[1] - 10,
        });

      
      yPos += rowHeight;
    });

    doc.y = yPos;
  }

  /**
   * Draw PRODUCT SUMMARY section
   */
  private drawProductSummarySection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureProductSummaryFits(doc, data);

    let yPos = doc.y + 25;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('PRODUCT SUMMARY', marginLeft, yPos);

    yPos += 30;

    // Table header
    const tableTop = yPos;
    const colWidths = [
      contentWidth * 0.40,
      contentWidth * 0.20,
      contentWidth * 0.20,
      contentWidth * 0.20,
    ];
    const headers = ['ITEM', 'QTY', 'PRICE', 'TOTAL'];

    // Header background
    doc
      .rect(marginLeft, tableTop, contentWidth, 25)
      .fill('#E8E8E8');
    //.stroke();

    // Header text
    let xPos = marginLeft;
    headers.forEach((header, i) => {
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(header, xPos + 5, tableTop + 8, {
          width: colWidths[i] - 10,
          align: 'left',
        });
      xPos += colWidths[i];
    });

    yPos = tableTop + 25;

    /*doc
      .rect(marginLeft, yPos, contentWidth, 25)
      .stroke();*/

    xPos = marginLeft;

    // Item
    doc
      .fillColor('#000000')
      .fontSize(9)
      .font('Helvetica')
      .text('DIAGNOSTIC & SOLUTION', xPos + 5, yPos + 8, {
        width: colWidths[0] - 10,
      });

    // Vertical line
    xPos += colWidths[0];

    /*doc
      .moveTo(xPos, yPos)
      .lineTo(xPos, yPos + 25)
      .stroke();*/

    // Qty
    doc
      .fontSize(9)
      .text('1', xPos + 5, yPos + 8, {
        width: colWidths[1] - 10,
      });

    // Vertical line
    xPos += colWidths[1];
    /*
    doc
      .moveTo(xPos, yPos)
      .lineTo(xPos, yPos + 25)
      .stroke();*/

    // Price
    doc
      .fontSize(9)
      .text(`$${data.price}`, xPos + 5, yPos + 8, {
        width: colWidths[2] - 10,
      });

    // Vertical line
    xPos += colWidths[2];
    /*doc
      .moveTo(xPos, yPos)
      .lineTo(xPos, yPos + 25)
      .stroke();*/

    // Total
    doc
      .fontSize(9)
      .text(`$${data.price}`, xPos + 5, yPos + 8, {
        width: colWidths[3] - 10,
      });

    yPos += 25;

    yPos += 16;

    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#333333')
      .text('The price includes parts and labor.', marginLeft + 5, yPos, {
        width: contentWidth - 10,
        align: 'left',
      });

    yPos += 24;

    const warrantyLabel = this.productSummaryWarrantyLabel(data);
    if (warrantyLabel) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text(warrantyLabel, marginLeft + 5, yPos, {
          width: contentWidth - 10,
          align: 'left',
        });
      yPos += 18;
    }

    yPos += 8;

    // Summary totals
    const summaryXPos = marginLeft + contentWidth * 0.60;
    const summaryWidth = contentWidth * 0.40;

    const lineColor = '#CCCCCC';
    const rowSpacing = 18;

    // SUBTOTAL
    doc.fontSize(12).font('Helvetica').fillColor('#333333')
      .text('SubTotal', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`$ ${data.price}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4, align: 'right',
    });
    yPos += rowSpacing;

    // Línea divisoria
    doc.strokeColor(lineColor).lineWidth(0.5)
      .moveTo(summaryXPos, yPos)
      .lineTo(summaryXPos + summaryWidth, yPos)
      .stroke();
    yPos += 8;

    // TAX 7%
    doc.fontSize(12).fillColor('#333333')
      .text('Tax 7%', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`$ ${data.tax}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4, align: 'right',
    });
    yPos += rowSpacing;

    if (data.discount && data.discount > 0) {
    // Línea
    doc.strokeColor(lineColor).lineWidth(0.5)
      .moveTo(summaryXPos, yPos).lineTo(summaryXPos + summaryWidth, yPos).stroke();
    yPos += 8;

    // DISCOUNT (en rojo)
    
    doc.fontSize(12).fillColor('#CC0000')
      .text('Discount', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.fillColor('#CC0000')
      .text(`-$ ${data.discount}`, summaryXPos + summaryWidth * 0.6, yPos, {
        width: summaryWidth * 0.4, align: 'right',
      });
    yPos += rowSpacing;
    }

    // Línea más gruesa antes del total
    doc.strokeColor('#666666').lineWidth(1.5)
      .moveTo(summaryXPos, yPos).lineTo(summaryXPos + summaryWidth, yPos).stroke();
    yPos += 12;

    // TOTAL (más grande y en negrita)
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
      .text('Total', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`$ ${data.total}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4, align: 'right',
    });
    yPos += rowSpacing;

    const advancePayment = Number(data.advancePayment || 0);
    if (advancePayment > 0) {
      const total = Number(data.total || 0);
      const pending = Math.max(total - advancePayment, 0);

      doc.strokeColor(lineColor).lineWidth(0.5)
        .moveTo(summaryXPos, yPos)
        .lineTo(summaryXPos + summaryWidth, yPos)
        .stroke();
      yPos += 8;

      doc.fontSize(12).font('Helvetica').fillColor('#333333')
        .text('Advance Payment', summaryXPos, yPos, { width: summaryWidth * 0.6 });
      doc.text(`$ ${advancePayment.toFixed(2)}`, summaryXPos + summaryWidth * 0.6, yPos, {
        width: summaryWidth * 0.4, align: 'right',
      });
      yPos += rowSpacing;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text('Pending', summaryXPos, yPos, { width: summaryWidth * 0.6 });
      doc.text(`$ ${pending.toFixed(2)}`, summaryXPos + summaryWidth * 0.6, yPos, {
        width: summaryWidth * 0.4, align: 'right',
      });
      yPos += rowSpacing;
    }

    doc.y = yPos;
  }

  private ensureProductSummaryFits(doc: PDFDocument, data: any): void {
    const bottomLimit = doc.page.height - doc.page.margins.bottom;
    const availableHeight = bottomLimit - doc.y;
    const requiredHeight = this.productSummaryEstimatedHeight(data);

    if (availableHeight < requiredHeight) {
      doc.addPage();
    }
  }

  private productSummaryEstimatedHeight(data: any): number {
    const rowSpacing = 18;
    let height = 25; // Space before title.
    height += 30; // Title to table header.
    height += 25; // Table header.
    height += 25; // Product row.
    height += 42; // Price note and space before totals.
    if (Number(data.warrantyDuration || 0) > 0) {
      height += 18; // Warranty line.
    }
    height += rowSpacing; // Subtotal.
    height += 8; // Divider.
    height += rowSpacing; // Tax.

    if (Number(data.discount || 0) > 0) {
      height += 8; // Divider.
      height += rowSpacing; // Discount.
    }

    height += 12; // Total divider.
    height += rowSpacing; // Total.

    if (Number(data.advancePayment || 0) > 0) {
      height += 8; // Divider.
      height += rowSpacing; // Advance payment.
      height += rowSpacing; // Pending.
    }

    return height + 12;
  }

  private productSummaryWarrantyLabel(data: any): string {
    const duration = Number(data.warrantyDuration || 0);
    if (duration <= 0) return '';

    const unit = String(data.warrantyDurationUnit || 'months').trim();
    return `Warranty: ${duration} ${unit}`;
  }



  /**
   * Draw Terms and Conditions section
   */
  private drawTermsOrWarrantyPolicy(doc: PDFDocument, data: any): void {
    if (data?.showWarrantyPolicy === true) {
      this.drawWarrantyPolicy(doc);
      return;
    }

    this.drawTermsAndConditions(doc);
  }

  /**
   * Draw Warranty Policy section for completed service orders
   */
  private drawWarrantyPolicy(doc: PDFDocument): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureSpace(doc, 210);
    let yPos = doc.y + 25;

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('WARRANTY POLICY', marginLeft, yPos);

    yPos += 28;

    const paragraphs = [
      'Miami Photography Center provides limited warranty coverage for the specific service and documented work performed under normal operating conditions.',
      'Warranty coverage and applicable period are specified individually within each completed service order.',
      'This warranty does not cover:',
    ];

    paragraphs.forEach((paragraph) => {
      doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
      const textHeight = doc.heightOfString(paragraph, { width: contentWidth, lineGap: 2 });
      if (yPos + textHeight + 8 > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }
      doc.text(paragraph, marginLeft, yPos, {
        width: contentWidth,
        align: 'left',
        lineGap: 2,
      });
      yPos += textHeight + 8;
    });

    const exclusions = [
      'Impact or liquid damage',
      'Sand, humidity or corrosion',
      'Improper handling or misuse',
      'Unauthorized repairs or tampering',
      'External electrical damage or accessories',
      'Data loss or media recovery',
    ];

    exclusions.forEach((item) => {
      doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
      const textHeight = doc.heightOfString(item, { width: contentWidth - 18, lineGap: 2 });
      if (yPos + textHeight + 4 > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      doc.text('-', marginLeft + 3, yPos, { width: 10 });
      doc.text(item, marginLeft + 18, yPos, {
        width: contentWidth - 18,
        align: 'left',
        lineGap: 2,
      });
      yPos += textHeight + 5;
    });

    yPos += 8;

    const closingParagraphs = [
      'All warranty evaluations must be performed by Miami Photography Center prior to approval.',
      'Equipment not claimed within 90 days after service completion notification may be subject to storage or abandonment procedures permitted under applicable regulations.',
      'For assistance:',
      'service@miamiphotographycenter.com',
      'www.miamiphotographycenter.com',
    ];

    closingParagraphs.forEach((paragraph, index) => {
      const isContactLine = index >= closingParagraphs.length - 2;
      doc
        .font(isContactLine ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8.5)
        .fillColor('#000000');
      const textHeight = doc.heightOfString(paragraph, { width: contentWidth, lineGap: 2 });
      if (yPos + textHeight + 8 > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }
      doc.text(paragraph, marginLeft, yPos, {
        width: contentWidth,
        align: 'left',
        lineGap: 2,
      });
      yPos += textHeight + (isContactLine ? 4 : 8);
    });

    doc.y = yPos;
  }

  private drawTermsAndConditions(doc: PDFDocument): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    this.ensureSpace(doc, 110);
    let yPos = doc.y + 25;

    // Section title
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('TERMS & CONDITIONS', marginLeft, yPos);

    yPos += 24;

    const sections = [
      {
        title: 'Repairs in workshop',
        items: [
          'Technical repair and maintenance of photographic cameras, lenses, flashes, and accessories at our specialized workshop.',
          'Free estimates are conducted in our workshop. If the final cost exceeds the estimate by more than 20%, prior approval will be requested.',
          'Diagnosis does not include data or photo recovery.',
          'Repairs include a limited warranty. Damage caused by drops, liquids, sand, or third-party tampering is excluded.',
          'Clients must back up files before delivering equipment. Miami Photography Center is not responsible for lost files.',
          'Equipment must be picked up within 30 days of notification. After 90 days, it may be sold or discarded to recover costs.',
        ],
      },
      {
        title: 'On-site services',
        items: [
          'Sensor cleaning, maintenance, and diagnostics may be performed at the client location via mobile unit.',
          'On-site diagnosis is $75 and deductible if repair is approved. Travel fee applies based on location.',
          'Full disassembly and immediate resolution are not guaranteed on-site if parts are needed.',
          'Client must provide proper access to the service area. Rescheduling is allowed with at least 24-hour notice.',
        ],
      },
    ];

    sections.forEach((section) => {
      if (yPos + 36 > this.pageBottom(doc)) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(section.title, marginLeft, yPos, { width: contentWidth });
      yPos += 14;

      section.items.forEach((item) => {
        doc.font('Helvetica').fontSize(8).fillColor('#000000');
        const textHeight = doc.heightOfString(item, { width: contentWidth - 18, lineGap: 1 });
        if (yPos + textHeight + 4 > this.pageBottom(doc)) {
          doc.addPage();
          yPos = doc.page.margins.top;
        }

        doc.text('-', marginLeft + 3, yPos, { width: 10 });
        doc.text(item, marginLeft + 18, yPos, {
          width: contentWidth - 18,
          align: 'left',
          lineGap: 1,
        });
        yPos += textHeight + 4;
      });

      yPos += 6;
    });

    doc.y = yPos;
  }

  /**
   * Helper to calculate text height
   */
  private calculateTextHeight(
    doc: PDFDocument,
    text: string,
    width: number,
    fontSize: number,
  ): number {
    const tempY = 0;
    doc.fontSize(fontSize);
    const heightUsed = doc.heightOfString(text, { width });
    return heightUsed;
  }


}
