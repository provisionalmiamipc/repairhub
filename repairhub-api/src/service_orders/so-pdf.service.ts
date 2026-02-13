import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { Response } from 'express';


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
        this.drawStatusHistorySection(doc, data);

        // Add new page for notes
        doc.addPage();
        this.drawNotesSection(doc, data);
        this.drawProductSummarySection(doc, data);
        this.drawTermsAndConditions(doc);

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
        this.drawStatusHistorySection(doc, data);

        // Add new page for notes and remaining sections
        doc.addPage();
        this.drawNotesSection(doc, data);
        this.drawProductSummarySection(doc, data);
        this.drawTermsAndConditions(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Draw the header with logo and company info
   */
  private drawHeader(doc: PDFDocument, data: any): void {
    const pageWidth = doc.page.width;
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const contentWidth = pageWidth - marginLeft - marginRight;



    // MPC text in logo
    try {
      doc.image('src/uploads/sopdf.jpg', 40, 40, { width: 120 });
    } catch (e) {

      // Yellow logo box (approximation - you would use an actual image)
      doc
        .rect(marginLeft, 50, 110, 110)
        .fillAndStroke('#FFED00', '#FFED00');

      // Si falla, ignora el logo
      doc
        .fillColor('#000000')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('MPC', marginLeft + 20, 80, { width: 70, align: 'center' });
    }


    // Company name and address (right side)
    doc
      .fillColor('#000000')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Miami Photography Center', marginLeft + 140, 50, {
        width: contentWidth - 140,
        align: 'right',
      });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(
        '3911 SW 27th St, West Park, 33023. United States of America',
        marginLeft + 140,
        70,
        { width: contentWidth - 140, align: 'right' },
      );

    /*doc.text('America', marginLeft + 140, 82, {
      width: contentWidth - 140,
      align: 'right',
    });*/

    // DATE and REPAIR ID section
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DATE:', marginLeft, 180);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(data.date, marginLeft, 195);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('REPAIR ID', marginLeft + 150, 180);

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
  }

  /**
   * Draw SUMMARY section
   */
  private drawSummarySection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 250;

    // SUMMARY title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('SUMMARY', marginLeft, yPos);

    yPos += 30;

    // Table header
    const tableTop = yPos;
    const colWidths = [contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25];
    const headers = ['EMPLOYEE', 'TECHNICIAN', 'CUSTOMER:', 'STATUS'];

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
    const rowData = [data.createdBy, data.assignedTech, data.customerName, data.lastRepairStatus?.status || ''];

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
  }

  /**
   * Draw DEVICE section
   */
  private drawDeviceSection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 350;

    // Table header
    const tableTop = yPos;
    const colWidths = [
      contentWidth * 0.20,
      contentWidth * 0.40,
      contentWidth * 0.20,
      contentWidth * 0.20,
    ];
    const headers = ['DEVICE', 'MODEL', 'SERIAL', 'ESTIMATED COST'];

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
    const rowHeight = 95;
    doc
      .rect(marginLeft, yPos, contentWidth, rowHeight);
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

    // Defective part
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(data.model, xPos + 5, yPos + 8, {
        width: colWidths[1] - 10,
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
        width: colWidths[2] - 10,
      });

    // Vertical line
    xPos += colWidths[2];
    /*doc
      .moveTo(xPos, tableTop)
      .lineTo(xPos, yPos + rowHeight)
      .stroke();*/

    // Cost
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`$ ${data.price}`, xPos + 5, yPos + 8, {
        width: colWidths[3] - 10,
      });
  }

  /**
   * Draw DEFECTIVE / WORKING PARTS section
   */
  private drawDefectivePartsSection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    let yPos = 470;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DEFECTIVE PARTS', marginLeft, yPos);

    yPos += 35;

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#000000')
      .text(data.defectivePart, marginLeft + 20, yPos);

    // Defective parts (with X)
    /*data.defectiveParts.forEach((part) => {
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#000000')
        .text(part.name, marginLeft + 20, yPos);

      // Red X symbol
      doc
        .fillColor('#CC0000')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('✗', marginLeft + 70, yPos - 2);

      yPos += 5;
    });

    // Working parts (with checkmark)
    yPos = 495;
    data.workingParts.forEach((part) => {
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#000000')
        .text(part.name, marginLeft + 300, yPos);

      // Green checkmark
      doc
        .fillColor('#00AA00')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('✓', marginLeft + 330, yPos - 2);

      yPos += 5;
    });*/
  }

  /**
   * Draw STATUS HISTORY section
   */
  private drawStatusHistorySection(doc: PDFDocument, data: any): void {

    if (data.repairStatus.length > 0) {
      const marginLeft = doc.page.margins.left;
      const marginRight = doc.page.margins.right;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - marginLeft - marginRight;

      let yPos = 540;

      // Section title
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('STATUS HISTORY', marginLeft, yPos);

      yPos += 30;

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

        yPos += 25;
      });
    }
  }

  /**
   * Draw NOTES section (page 2)
   */
  private drawNotesSection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 50;

    // Section title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('NOTES', marginLeft, yPos);

    yPos += 30;

    // Table header
    const tableTop = yPos;
    const colWidths = [
      contentWidth * 0.15,
      contentWidth * 0.15,
      contentWidth * 0.70,
    ];
    const headers = ['NOTE', 'DESCRIPTION'];
    const notes = [{ type: 'Reception', note: data.noteReception }, { type: 'Estimated', note: data.estimated }];

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
      const noteHeight = this.calculateTextHeight(doc, note.note, colWidths[2] - 10, 9);
      const rowHeight = Math.max(25, noteHeight + 16);

      /*doc
        .rect(marginLeft, yPos, contentWidth, rowHeight)
        .stroke();
        */
      xPos = marginLeft;

      // Date
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica')
        .text(note.type, xPos + 5, yPos + 8, {
          width: colWidths[0] - 10,
        });

      // Vertical line
      xPos += colWidths[1];
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
          width: colWidths[2] - 10,
        });

      // Vertical line
      //xPos += colWidths[1];
      /*
      doc
        .moveTo(xPos, yPos)
        .lineTo(xPos, yPos + rowHeight)
        .stroke();*/

      // Note
      /* doc
         .fontSize(9)
         .font('Helvetica')
         .text(note.note, xPos + 5, yPos + 8, {
           width: colWidths[2] - 10,
         });*/

      yPos += rowHeight;
    });
  }

  /**
   * Draw PRODUCT SUMMARY section
   */
  private drawProductSummarySection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 220;

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

    // Product rows
    /*
    data.products.forEach((product) => {
      doc
        .rect(marginLeft, yPos, contentWidth, 25)
        .stroke();

      xPos = marginLeft;

      // Item
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica')
        .text(product.item, xPos + 5, yPos + 8, {
          width: colWidths[0] - 10,
        });

      // Vertical line
      xPos += colWidths[0];
      doc
        .moveTo(xPos, yPos)
        .lineTo(xPos, yPos + 25)
        .stroke();

      // Qty
      doc
        .fontSize(9)
        .text(product.qty.toString(), xPos + 5, yPos + 8, {
          width: colWidths[1] - 10,
        });

      // Vertical line
      xPos += colWidths[1];
      doc
        .moveTo(xPos, yPos)
        .lineTo(xPos, yPos + 25)
        .stroke();

      // Price
      doc
        .fontSize(9)
        .text(`$${product.price}`, xPos + 5, yPos + 8, {
          width: colWidths[2] - 10,
        });

      // Vertical line
      xPos += colWidths[2];
      doc
        .moveTo(xPos, yPos)
        .lineTo(xPos, yPos + 25)
        .stroke();

      // Total
      doc
        .fontSize(9)
        .text(`$${product.total}`, xPos + 5, yPos + 8, {
          width: colWidths[3] - 10,
        });

      yPos += 25;
    });*/

    yPos += 30;

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

    /*doc
      .fontSize(12)
      .font('Helvetica')
      .text('SubTotal', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`$ ${data.price}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4,
      align: 'right',
    });

    yPos += 25;
    doc.text('Tax 7%', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`$ ${data.tax}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4,
      align: 'right',
    });

    yPos += 25;
    doc.text('Discount', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`-$ ${data.discount}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4,
      align: 'right',
    });

    yPos += 25;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total', summaryXPos, yPos, { width: summaryWidth * 0.6 });
    doc.text(`$ ${data.total}`, summaryXPos + summaryWidth * 0.6, yPos, {
      width: summaryWidth * 0.4,
      align: 'right',
    });*/
  }

  /**
   * Draw Total SUMMARY section
   */
  private drawTotalSummarySection(doc: PDFDocument, data: any): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

  }

  /**
   * Draw Terms and Conditions section
   */
  private drawTermsAndConditions(doc: PDFDocument): void {
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 580;

    // Section title
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Terms & conditions', marginLeft, yPos);

    yPos += 20;

    // Terms text
    const termsText = `Miami Photography Center Last updated: August 2025 Repairs (in workshop) Scope of Service Technical repair and maintenance of photographic cameras, lenses, flashes, and accessories at our specialized workshop. Estimates and Diagnosis - Free estimates conducted in our workshop. - If final cost exceeds the estimate by more than 20%, prior approval will be requested. - Diagnosis does not include data or photo recovery. Repair Warranty - Repairs include a limited 6-month warranty. - Excludes damage caused by drops, liquids, sand, or third-party tampering. Liability - We are not responsible for lost files. - Clients must back up data before delivering equipment. Equipment Pickup - Equipment must be picked up within 30 days of notification. - After 90 days, it may be sold or discarded to recover costs. On-site Services Scope of Service Sensor cleaning, maintenance, and`;

    doc
      .fontSize(7)
      .font('Helvetica')
      .text(termsText, marginLeft, yPos, {
        width: contentWidth,
        align: 'justify',
      });

    // Add new page for continuation
    doc.addPage();
    yPos = 50;

    const termsText2 = `diagnostics performed at the client's location via mobile unit. Diagnosis and Costs - On-site diagnosis: $45, deductible if repair is approved. - Travel fee applies based on location. - Full disassembly not guaranteed on-site. Warranty and Liability - Same 6-month warranty as workshop repairs. - Immediate on-site resolution not guaranteed if parts are needed. Logistics - Client must provide proper access to the service area. - Rescheduling allowed with at least 24-hour notice.`;

    doc
      .fontSize(7)
      .font('Helvetica')
      .text(termsText2, marginLeft, yPos, {
        width: contentWidth,
        align: 'justify',
      });

    // Signature line
    yPos += 80;
    doc
      .strokeColor('#000000')
      .lineWidth(1)
      .moveTo(marginLeft, yPos)
      .lineTo(marginLeft + 200, yPos)
      .stroke();

    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Authorized Signature', marginLeft, yPos + 5);
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
