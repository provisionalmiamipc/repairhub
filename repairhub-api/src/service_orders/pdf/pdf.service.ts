// src/pdf/pdf.service.ts
import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateRepairDetailsPdf(data: any): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(resolve => {
      const doc = new PDFDocument({
        size: 'A4', // 595.28 x 841.89 points
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      // --- Estructura del PDF ---

      this.generateHeader(doc, data);
      this.generateSummaryTable(doc, data);
      this.generateDeviceDetails(doc, data);
      this.generateDefectiveParts(doc, data);
      this.generateStatusHistory(doc, data);
      this.generateTermsAndConditions(doc);

      // Finalizar el documento y resolver la promesa con el Buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const data = Buffer.concat(buffers);
        resolve(data);
      });
      doc.end();
    });

    return pdfBuffer;
  }

  // Métodos auxiliares para dibujar secciones (simulando el layout)

  private generateHeader(doc: PDFDocument, data: any) {
    // Asumiendo que el logo está disponible localmente
    // const logoPath = 'path/to/your/logo.png'; 
    // doc.image(logoPath, 40, 40, { width: 80 }); 

    // Texto de la dirección
    doc.fontSize(10)
       .text('Miami Photography Center', 200, 40, { align: 'right' })
       .text('3911 SW 27th St, West Park, 33023. United States of America', 200, 52, { align: 'right' });

    // Sección superior con la línea naranja
    const topY = 90;
    doc.fillColor('#FF5733') // Naranja de la línea
       .rect(40, topY, 515, 2)
       .fill()
       .moveDown();

    doc.fillColor('#000000') // Volver a negro
       .fontSize(10)
       .text('DATE:', 40, topY + 10)
       .text(data.date, 80, topY + 10)
       .text('REPAIR ID', 180, topY + 10)
       .text(data.repairId, 240, topY + 10);
       
    doc.fontSize(16).font('Helvetica-Bold').text('Repair Details', 400, topY + 10, {align: 'right'});
    doc.font('Helvetica'); // Reset font
  }

  private generateSummaryTable(doc: PDFDocument, data: any) {
    const y = 140;
    doc.fontSize(14).font('Helvetica-Bold').text('SUMMARY', 40, y);
    doc.font('Helvetica');

    const tableTop = y + 25;
    const itemHeight = 30;

    // Dibujar la estructura de la tabla manualmente (PDFKit básico)
    // Headers (fondo gris claro #f0f0f0)
    doc.fillColor('#f0f0f0').rect(40, tableTop, 515, itemHeight - 5).fill();
    doc.fillColor('#000000').fontSize(10);
    doc.text('EMPLOYEE', 45, tableTop + 10)
       .text('TECHNICIAN', 180, tableTop + 10)
       .text('CUSTOMER', 320, tableTop + 10)
       .text('STATUS', 480, tableTop + 10);

    // Fila de datos
    const dataY = tableTop + itemHeight;
    doc.fillColor('#FFFFFF').rect(40, dataY, 515, itemHeight - 5).fill(); // Fondo blanco
    doc.fillColor('#000000').fontSize(10);
    doc.text(data.employee, 45, dataY + 10)
       .text(data.technician, 180, dataY + 10)
       .text(data.customer, 320, dataY + 10)
       .text(data.status, 480, dataY + 10);
  }

  // Resto de métodos (generateDeviceDetails, generateDefectiveParts, etc.)
  // seguirían la misma lógica de coordenadas X/Y y tamaños de fuente específicos.

  private generateDeviceDetails(doc: PDFDocument, data: any) {
    // Implementación similar a la tabla Summary, pero con más filas
    // ... lógica de dibujo manual de tablas ...
  }

  private generateDefectiveParts(doc: PDFDocument, data: any) {
    // Implementación para la sección de ítems con checks (Unicode ticks/crosses)
    // ...
  }

  private generateStatusHistory(doc: PDFDocument, data: any) {
    // Implementación para la sección inferior de la tabla
    // ...
  }
  
  private generateTermsAndConditions(doc: PDFDocument) {
    // Asegurarse de que el texto fluya correctamente con doc.text(..., {width: ..., align: 'justify'})
    // ...
  }
}
