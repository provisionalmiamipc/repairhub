import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { SquarePaymentLinksService } from '../service_orders/square-payment-links.service';
import { InvoicePaymentLink } from './entities/invoice-payment-link.entity';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicePaymentLinksService {
  constructor(
    @InjectRepository(InvoicePaymentLink)
    private readonly paymentLinkRepo: Repository<InvoicePaymentLink>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly square: SquarePaymentLinksService,
  ) {}

  canManage(actor: any): boolean {
    return actor?.type === 'user'
      || actor?.role === 'user'
      || actor?.employee_type === 'Accountant'
      || actor?.employee_type === 'AdminStore'
      || actor?.role === 'Accountant'
      || actor?.role === 'AdminStore'
      || actor?.isCenterAdmin === true;
  }

  assertCanManage(actor: any): void {
    if (!this.canManage(actor)) {
      throw new ForbiddenException('You cannot manage Square payment links');
    }
  }

  findByInvoice(invoiceId: number) {
    return this.paymentLinkRepo.find({
      where: [
        { invoiceId, status: 'pending' },
        { invoiceId, status: 'paid' },
        { invoiceId, status: 'failed' },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async create(invoiceId: number, actor: any): Promise<InvoicePaymentLink> {
    this.assertCanManage(actor);
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['customer'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'issued') {
      throw new BadRequestException('Payment links can only be created for issued invoices');
    }

    const amount = Math.round(Number(invoice.total || 0) * 100);
    if (amount <= 0) {
      throw new BadRequestException('Invoice total must be greater than $0.00');
    }

    const existing = await this.paymentLinkRepo.findOne({
      where: { invoiceId, status: In(['pending', 'failed']) },
    });
    if (existing) {
      throw new BadRequestException('This invoice already has an active payment link');
    }

    const customerName = invoice.billToName?.trim()
      || [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(' ')
      || 'Customer';
    const link = await this.paymentLinkRepo.save(this.paymentLinkRepo.create({
      invoiceId,
      title: `${customerName} - Invoice ${invoice.invoiceNumber}`,
      amount: String(amount),
      currency: 'USD',
      status: 'failed',
      idempotencyKey: randomUUID(),
      createdById: actor?.employeeId ?? actor?.id ?? invoice.createdById ?? null,
    }));

    return this.attemptSquareCreation(link);
  }

  async retry(invoiceId: number, linkId: number, actor: any): Promise<InvoicePaymentLink> {
    this.assertCanManage(actor);
    const link = await this.findOneForInvoice(invoiceId, linkId);
    if (link.status !== 'failed') {
      throw new BadRequestException('Only failed payment links can be retried');
    }

    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice || invoice.status !== 'issued') {
      throw new BadRequestException('Payment links can only be created for issued invoices');
    }
    return this.attemptSquareCreation(link);
  }

  async remove(invoiceId: number, linkId: number, actor: any): Promise<InvoicePaymentLink> {
    this.assertCanManage(actor);
    const link = await this.findOneForInvoice(invoiceId, linkId);
    return this.deleteUnpaidLink(link);
  }

  async checkStatus(invoiceId: number, linkId: number, actor: any): Promise<InvoicePaymentLink> {
    this.assertCanManage(actor);
    const link = await this.findOneForInvoice(invoiceId, linkId);
    if (link.status !== 'pending') {
      throw new BadRequestException('Only pending payment links can be checked');
    }
    await this.safePaidCheck(link, true);
    return link;
  }

  async cancelOpenLinks(invoiceId: number): Promise<void> {
    const links = await this.paymentLinkRepo.find({
      where: { invoiceId, status: In(['pending', 'failed']) },
    });
    for (const link of links) {
      await this.deleteUnpaidLink(link);
    }
  }

  @Cron('30 */2 * * * *')
  async refreshPendingLinks(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const links = await this.paymentLinkRepo.find({
      where: {
        status: 'pending',
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { lastCheckedAt: 'ASC' },
      take: 100,
    });
    for (const link of links) {
      await this.safePaidCheck(link, false);
    }
  }

  private async attemptSquareCreation(link: InvoicePaymentLink): Promise<InvoicePaymentLink> {
    try {
      const result = await this.square.createPaymentLink({
        title: link.title,
        amount: Number(link.amount),
        currency: link.currency,
        idempotencyKey: link.idempotencyKey,
      });
      link.squarePaymentLinkId = result.id;
      link.squareOrderId = result.orderId;
      link.url = result.url;
      link.status = 'pending';
      link.lastError = null;
      link.lastCheckedAt = new Date();
    } catch (error: any) {
      link.status = 'failed';
      link.lastError = this.errorMessage(error);
      link.lastCheckedAt = new Date();
    }
    return this.paymentLinkRepo.save(link);
  }

  private async deleteUnpaidLink(link: InvoicePaymentLink): Promise<InvoicePaymentLink> {
    if (link.status === 'paid') {
      throw new BadRequestException('Paid payment links cannot be deleted');
    }
    if (link.status === 'deleted') return link;

    if (link.squareOrderId && await this.safePaidCheck(link, true)) {
      throw new BadRequestException('This payment link has already been paid and cannot be deleted');
    }
    if (link.squarePaymentLinkId) {
      await this.square.deletePaymentLink(link.squarePaymentLinkId);
    }

    link.status = 'deleted';
    link.deletedAt = new Date();
    link.lastError = null;
    return this.paymentLinkRepo.save(link);
  }

  private async safePaidCheck(link: InvoicePaymentLink, rethrow: boolean): Promise<boolean> {
    if (!link.squareOrderId) return false;
    try {
      const paid = await this.square.isOrderPaid(link.squareOrderId);
      link.lastCheckedAt = new Date();
      link.lastError = null;
      if (paid) {
        link.status = 'paid';
        link.paidAt = link.paidAt ?? new Date();
      }
      await this.paymentLinkRepo.save(link);
      if (paid) {
        await this.invoiceRepo.update(
          { id: link.invoiceId, status: 'issued' },
          { status: 'paid' },
        );
      }
      return paid;
    } catch (error: any) {
      link.lastCheckedAt = new Date();
      link.lastError = this.errorMessage(error);
      await this.paymentLinkRepo.save(link);
      if (rethrow) throw error;
      return false;
    }
  }

  private async findOneForInvoice(invoiceId: number, linkId: number): Promise<InvoicePaymentLink> {
    const link = await this.paymentLinkRepo.findOne({ where: { id: linkId, invoiceId } });
    if (!link) throw new NotFoundException(`Payment link #${linkId} not found`);
    return link;
  }

  private errorMessage(error: any): string {
    const message = error?.response?.message ?? error?.message ?? 'Square request failed';
    return Array.isArray(message) ? message.join(', ') : String(message).slice(0, 2000);
  }
}
