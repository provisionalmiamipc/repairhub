import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { ServiceOrder } from './entities/service_order.entity';

@Injectable()
export class ServiceOrderPdfService {
    async generate(order: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40 });
            const stream = new PassThrough();
            const chunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', (err: Error) => reject(err));
            doc.pipe(stream);

            // Logo
            try {
                                const logo = require('../common/asset-utils').resolveUpload(['logo.png','logo.jpg','sopdf.jpg','sopdf.png']);
                                if (logo) {
                                    try { doc.image(logo, 40, 20, { width: 120 }); } catch(e) { /* ignore */ }
                                }
            } catch (e) {
                // Si falla, ignora el logo
            }
            doc.moveDown();
            doc.fontSize(22).fillColor('#0056b3').text('Service Order Confirmation', { align: 'center' });
            doc.moveDown();

            // Datos de la orden
            doc.fontSize(12).fillColor('#333');
            doc.text(`Order Code: ${order.orderCode}`);
            doc.text(`Customer: ${order.customerName}`);
            const date = order.date instanceof Date ? order.date : new Date(order.date);
            doc.text(`Date: ${date.toLocaleDateString()}`);
            doc.text(`Device: ${order.device}`);
            doc.moveDown();

            // Tabla financiera
            doc.fontSize(14).fillColor('#0056b3').text('Financial Summary', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('#333');
            const price = Number(order.price) || 0;
            const ctax = Number(order.tax) || 0;
            const tax = price * ctax / 100; 
            const discount = Number(order.discount) || 0;
            const total = price - discount + tax;
            doc.text(`Price: $${price.toFixed(0)}`);
            doc.text(`Tax ${ctax.toFixed(0)}%: $${tax.toFixed(0)}`);
            doc.text(`Discount: $${discount.toFixed(0)}`);
            doc.text(`Total: $${total.toFixed(0)}`);
            doc.moveDown();

            // Terms & Conditions
            doc.moveDown(2);
            doc.fontSize(12).fillColor('#0056b3').text('Terms & Conditions', { underline: true });
            doc.moveDown(0.5);
            const terms = 'Miami Photography Center Last updated: August 2025 Repairs (in workshop) Scope of Service' +
            'Technical repair and maintenance of photographic cameras, lenses, flashes, and accessories at our' +   
            'specialized workshop. Estimates and Diagnosis - Free estimates conducted in our workshop. - If final' +
            'cost exceeds the estimate by more than 20%, prior approval will be requested. - Diagnosis does not' +
            'include data or photo recovery. Repair Warranty - Repairs include a limited 6-month warranty. -' +
            'Excludes damage caused by drops, liquids, sand, or third-party tampering. Liability - We are not' +
            'responsible for lost files. - Clients must back up data before delivering equipment. Equipment Pickup -' +
            'Equipment must be picked up within 30 days of notification. - After 90 days, it may be sold or' +
            'discarded to recover costs. On-site Services Scope of Service Sensor cleaning, maintenance, anddiagnostics' + 
            'performed at the client’s location via mobile unit. Diagnosis and Costs - On-site diagnosis:' +
            '$45, deductible if repair is approved. - Travel fee applies based on location. - Full disassembly not' +
            'guaranteed on-site. Warranty and Liability - Same 6-month warranty as workshop repairs. - Immediate' +
            'on-site resolution not guaranteed if parts are needed. Logistics - Client must provide proper access to' +
            'the service area. - Rescheduling allowed with at least 24-hour notice.';
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            doc.fontSize(10).fillColor('#444').text(terms, { width: pageWidth, align: 'justify'});

            // Footer
            doc.moveDown(2);
            doc.fontSize(11).fillColor('#888').text('Thank you for trusting Miami Photography Center.', { align: 'center' });
            doc
                .fontSize(10)
                .fillColor('#aaa')
                .text('For questions or support, contact us at support@miamiphotographycenter.com', { align: 'center' });

            doc.end();
        });
    }
}
                
