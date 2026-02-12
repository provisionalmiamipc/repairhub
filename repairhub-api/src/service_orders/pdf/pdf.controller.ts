// src/pdf/pdf.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import express from 'express';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('download-details')
  async downloadPdf(@Res() res: express.Response): Promise<void> {
    // Datos de ejemplo basados en tu PDF (pueden venir de una DB)
    const pdfData = {
      date: '01/06/2026',
      repairId: 'RS97',
      employee: 'Karla Garcia',
      technician: 'Orlando Untoria',
      customer: 'AMOGH SAHAI',
      status: 'In Progress',
      device: 'CANON EOS R7',
      condition: 'The camera was exposed to rainwater...',
      serial: '082034005025',
    };

    const buffer = await this.pdfService.generateRepairDetailsPdf(pdfData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=repair-details.pdf', // Para forzar descarga
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
