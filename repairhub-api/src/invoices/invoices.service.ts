import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../common/email/email.service';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { SOItem } from '../s_o_items/entities/s_o_item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SendInvoiceEmailDto } from './dto/send-invoice-email.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicePaymentLinksService } from './invoice-payment-links.service';

@Injectable()
export class InvoicesService {
  private readonly relations = ['center', 'store', 'customer', 'serviceOrder', 'createdBy', 'paymentType', 'items', 'items.item', 'items.serviceOrder', 'paymentLinks'];

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepo: Repository<InvoiceItem>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepo: Repository<ServiceOrder>,
    @InjectRepository(SOItem)
    private readonly soItemRepo: Repository<SOItem>,
    private readonly pdfService: InvoicePdfService,
    private readonly emailService: EmailService,
    private readonly paymentLinksService: InvoicePaymentLinksService,
  ) {}

  async create(dto: CreateInvoiceDto) {
    const { items, ...invoiceData } = dto;
    const invoiceNumber = dto.invoiceNumber?.trim() || await this.getNextInvoiceNumber();
    const issueDate = dto.issueDate ?? new Date().toISOString().slice(0, 10);

    const invoice = this.invoiceRepo.create({
      ...invoiceData,
      invoiceNumber,
      issueDate,
      status: 'draft',
      subtotal: 0,
      discount: Number(dto.discount ?? 0),
      tax: Number(dto.tax ?? 0),
      total: 0,
    });

    const savedInvoice = await this.invoiceRepo.save(invoice);

    if (items?.length) {
      await this.addItems(savedInvoice.id, items);
    }

    return this.findOne(savedInvoice.id);
  }

  async createFromServiceOrder(serviceOrderId: number, createdById?: number) {
    const so = await this.findServiceOrderForInvoice(serviceOrderId);

    if (!so) throw new NotFoundException(`ServiceOrder #${serviceOrderId} not found`);

    const base = await this.create({
      centerId: so.centerId,
      storeId: so.storeId,
      customerId: so.customerId,
      serviceOrderId: so.id,
      createdById: createdById ?? so.createdById,
      paymentTypeId: so.paymentTypeId,
      notes: `Draft generated from service order ${so.orderCode}`,
      billToName: so.customer ? `${so.customer.firstName} ${so.customer.lastName}` : undefined,
      billToAddress: so.customer?.city,
      billToContact: [so.customer?.phone, so.customer?.email].filter(Boolean).join(' | '),
      serviceSummary: '',
      via: 'Workshop',
      tax: 0,
      items: [],
    });

    return this.addServiceOrder(base.id, serviceOrderId);
  }

  findAll(customerId?: number) {
    if (customerId) {
      return this.invoiceRepo.find({
        where: { customerId },
        relations: this.relations,
        order: { createdAt: 'DESC' },
      });
    }

    return this.invoiceRepo.find({ relations: this.relations, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id }, relations: this.relations });
    if (!invoice) throw new NotFoundException('Invoice not found');
    invoice.paymentLinks = (invoice.paymentLinks || []).filter((link) => link.status !== 'deleted');
    return invoice;
  }

  async update(id: number, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(id);
    this.assertDraft(invoice);
    await this.invoiceRepo.update(id, dto);
    if (dto.tax !== undefined || dto.discount !== undefined) {
      await this.recalculateTotals(id);
    }
    return this.findOne(id);
  }

  async addItems(invoiceId: number, items: CreateInvoiceItemDto[]) {
    const invoice = await this.findOne(invoiceId);
    this.assertDraft(invoice);

    const entities = items.map((line) => {
      const quantity = Number(line.quantity ?? 0);
      const unitPrice = Number(line.unitPrice ?? 0);
      const discount = Number(line.discount ?? 0);
      const base = quantity * unitPrice - discount;
      const lineTotal = base;

      return this.itemRepo.create({
        invoiceId,
        itemType: line.itemType,
        itemId: line.itemId,
        serviceOrderId: line.serviceOrderId,
        description: line.description,
        quantity,
        unitPrice,
        discount,
        lineTotal,
        sortOrder: line.sortOrder ?? 0,
      });
    });

    await this.itemRepo.save(entities);
    await this.recalculateTotals(invoiceId);
    return this.findOne(invoiceId);
  }

  async replaceItems(invoiceId: number, items: CreateInvoiceItemDto[]) {
    const invoice = await this.findOne(invoiceId);
    this.assertDraft(invoice);
    await this.itemRepo.delete({ invoiceId });
    return this.addItems(invoiceId, items);
  }

  async addServiceOrder(invoiceId: number, serviceOrderId: number) {
    const invoice = await this.findOne(invoiceId);
    this.assertDraft(invoice);

    const so = await this.findServiceOrderForInvoice(serviceOrderId);
    if (!so) throw new NotFoundException(`ServiceOrder #${serviceOrderId} not found`);

    if (invoice.customerId !== so.customerId) {
      throw new BadRequestException('Service order customer must match invoice customer');
    }

    if (invoice.centerId !== so.centerId || invoice.storeId !== so.storeId) {
      throw new BadRequestException('Service order center/store must match invoice center/store');
    }

    const alreadyAdded = (invoice.items || []).some(
      (item) => item.serviceOrderId === so.id && item.itemType === 'service',
    );
    if (alreadyAdded) throw new BadRequestException('Service order is already included in this invoice');

    const nextSortOrder = (invoice.items || []).reduce((max, item) => Math.max(max, Number(item.sortOrder || 0)), -1) + 1;
    await this.addItems(invoice.id, [{
      itemType: 'service',
      serviceOrderId: so.id,
      description: this.serviceOrderDescription(so),
      quantity: 1,
      unitPrice: Number(so.price ?? 0),
      discount: Number(so.costdiscount ?? 0),
      sortOrder: nextSortOrder,
    }]);

    const summary = this.appendSummaryLine(invoice.serviceSummary, this.serviceOrderSummary(so));
    await this.invoiceRepo.update(invoice.id, {
      serviceOrderId: invoice.serviceOrderId ?? so.id,
      serviceSummary: summary,
    });

    return this.findOne(invoice.id);
  }

  async issue(id: number) {
    const invoice = await this.findOne(id);
    this.assertDraft(invoice);
    if (!invoice.items?.length) throw new BadRequestException('Cannot issue invoice without lines');

    await this.invoiceRepo.update(id, { status: 'issued' });
    return this.findOne(id);
  }

  async generatePdf(id: number) {
    const invoice = await this.findOne(id);
    return this.pdfService.generate(invoice);
  }

  async sendEmail(id: number, dto: SendInvoiceEmailDto = {}) {
    const invoice = await this.findOne(id);
    const to = dto.to || invoice.customer?.email;
    if (!to) throw new BadRequestException('Customer email is required to send invoice');

    const pdfBuffer = await this.pdfService.generate(invoice);
    const customerName = invoice.billToName || `${invoice.customer?.firstName ?? ''} ${invoice.customer?.lastName ?? ''}`.trim();
    const subject = dto.subject || `Invoice No. ${invoice.invoiceNumber} Available`;
    const message = dto.message || 'Your invoice has been generated and is attached to this email for your review.';
    const headerAttachment = this.invoiceEmailHeaderAttachment();

    await this.emailService.sendEmail({
      to,
      subject,
      html: this.invoiceEmailHtml(customerName || 'Customer', message),
      attachments: [
        ...(headerAttachment ? [headerAttachment] : []),
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return { sent: true };
  }

  private invoiceEmailHtml(customerName: string, message: string): string {
    return `
      <!doctype html>
      <html style="color-scheme: light only; supported-color-schemes: light;">
        <head>
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light" />
        </head>
        <body bgcolor="#f6f7f9" style="margin:0; padding:0; background:#f6f7f9; background-color:#f6f7f9; font-family:Arial, sans-serif; color:#222;">
          <div style="max-width:640px; margin:0 auto; padding:28px 16px;">
            <div style="background:#ffffff; border:1px solid #e7e7e7; border-radius:8px; overflow:hidden;">
              <img src="cid:email-header@repairhub" alt="Miami Photography Center" style="display:block; width:100%; max-width:640px; height:auto; margin:0;" />
              <div style="padding:30px;">
                <h1 style="margin:0 0 18px 0; font-size:22px; line-height:1.3; color:#111111;">Invoice Notification</h1>
                <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6;">Dear <strong>${customerName}</strong>,</p>
                <p style="margin:0 0 14px 0; font-size:15px; line-height:1.6;">${message}</p>
                <p style="margin:0 0 22px 0; font-size:15px; line-height:1.6;">
                  Please refer to the attached PDF document for the complete service and billing details related to your order.
                </p>
                <div style="border-top:1px solid #ececec; margin:24px 0;"></div>
                <p style="margin:0 0 8px 0; font-size:14px; line-height:1.6; color:#666666;">
                  If you have any questions regarding the invoice, payment process or service details, please contact us directly at:
                </p>
                <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6;">
                  <a href="mailto:service@miamiphotographycenter.com" style="color:#0056b3; text-decoration:none;">service@miamiphotographycenter.com</a>
                </p>
                <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6;">Thank you for choosing Miami Photography Center.</p>
                <p style="margin:0; font-size:15px; line-height:1.6;">
                  Best regards,<br />
                  <strong>Miami Photography Center</strong><br />
                  <span style="color:#0056b3;">Billing &amp; Service Department</span>
                </p>
              </div>
            </div>
            <div style="padding:16px 8px 0 8px; font-size:12px; line-height:1.5; color:#999999; text-align:center;">
              This is an automated notification message.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private invoiceEmailHeaderAttachment() {
    const headerPath = [
      join(__dirname, '..', 'templates', 'emails', 'assets', 'email-header.png'),
      join(__dirname, '..', '..', 'templates', 'emails', 'assets', 'email-header.png'),
      join(process.cwd(), 'src', 'templates', 'emails', 'assets', 'email-header.png'),
    ].find(candidate => existsSync(candidate));

    if (!headerPath) return null;

    return {
      filename: 'email-header.png',
      content: readFileSync(headerPath),
      contentType: 'image/png',
      cid: 'email-header@repairhub',
      content_id: 'email-header@repairhub',
      contentDisposition: 'inline',
      disposition: 'inline',
      content_disposition: 'inline',
    };
  }

  async recordPayment(id: number, dto: RecordPaymentDto) {
    const invoice = await this.findOne(id);
    if (invoice.status !== 'issued') {
      throw new BadRequestException('Only issued invoices can be marked as paid');
    }

    await this.paymentLinksService.cancelOpenLinks(id);
    await this.invoiceRepo.update(id, {
      status: 'paid',
      notes: dto.notes ? `${invoice.notes ?? ''}\n${dto.notes}`.trim() : invoice.notes,
    });
    return this.findOne(id);
  }

  async void(id: number, dto: VoidInvoiceDto) {
    const invoice = await this.findOne(id);
    if (invoice.status === 'paid') {
      throw new BadRequestException('Paid invoices cannot be voided directly');
    }

    await this.paymentLinksService.cancelOpenLinks(id);
    await this.invoiceRepo.update(id, {
      status: 'void',
      notes: `${invoice.notes ?? ''}\nVoid reason: ${dto.reason}`.trim(),
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    const invoice = await this.findOne(id);
    this.assertDraft(invoice);
    await this.invoiceRepo.delete(id);
    return { deleted: true };
  }

  private assertDraft(invoice: Invoice) {
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be edited');
    }
  }

  private async recalculateTotals(invoiceId: number) {
    const lines = await this.itemRepo.find({ where: { invoiceId } });
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });

    const subtotal = lines.reduce((acc, l) => acc + Number(l.lineTotal), 0);
    const discount = Number(invoice?.discount ?? 0);
    const taxPercent = Number(invoice?.tax ?? 0);
    const taxAmount = subtotal * (taxPercent / 100);
    const total = subtotal + taxAmount - discount;

    await this.invoiceRepo.update(invoiceId, {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      tax: Number(taxPercent.toFixed(2)),
      total: Number(total.toFixed(2)),
    });
  }

  private async getNextInvoiceNumber() {
    const latest = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .orderBy('invoice.id', 'DESC')
      .getOne();

    const latestNumber = Number(String(latest?.invoiceNumber || '').replace(/\D/g, ''));
    const next = Number.isFinite(latestNumber) && latestNumber > 0 ? latestNumber + 1 : (latest?.id ?? 0) + 1;
    return String(next).padStart(8, '0');
  }

  private findServiceOrderForInvoice(serviceOrderId: number) {
    return this.serviceOrderRepo.findOne({
      where: { id: serviceOrderId },
      relations: ['customer', 'device', 'deviceBrand'],
    });
  }

  private serviceOrderDescription(so: ServiceOrder): string {
    return `${so.orderCode} - ${[so.device?.name, so.deviceBrand?.name, so.model].filter(Boolean).join(' ')}`;
  }

  private serviceOrderSummary(so: ServiceOrder): string {
    return `${so.orderCode} - ${so.defectivePart || so.model || 'Repair service'}`;
  }

  private appendSummaryLine(current: string | null | undefined, line: string): string {
    const lines = (current || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!lines.includes(line)) lines.push(line);
    return lines.join('\n');
  }
}
