import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { ServiceOrderPaymentLink } from './entities/service-order-payment-link.entity';
import { ServiceOrder } from './entities/service_order.entity';
import { SquarePaymentLinksService } from './square-payment-links.service';

@Injectable()
export class ServiceOrderPaymentLinksService {
  constructor(
    @InjectRepository(ServiceOrderPaymentLink)
    private readonly paymentLinkRepository: Repository<ServiceOrderPaymentLink>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
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

  findByServiceOrder(serviceOrderId: number, includeDeleted = false) {
    return this.paymentLinkRepository.find({
      where: includeDeleted ? { serviceOrderId } : [
        { serviceOrderId, status: 'pending' },
        { serviceOrderId, status: 'paid' },
        { serviceOrderId, status: 'failed' },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    serviceOrderId: number,
    dto: CreatePaymentLinkDto,
    actor?: any,
    createdById?: number | null,
  ): Promise<ServiceOrderPaymentLink> {
    if (actor) this.assertCanManage(actor);
    const order = await this.serviceOrderRepository.findOne({ where: { id: serviceOrderId } });
    if (!order) throw new NotFoundException(`ServiceOrder #${serviceOrderId} not found`);

    const link = await this.paymentLinkRepository.save(this.paymentLinkRepository.create({
      serviceOrderId,
      concept: dto.concept,
      title: dto.title.trim(),
      amount: String(dto.amount),
      currency: 'USD',
      status: 'failed',
      idempotencyKey: randomUUID(),
      createdById: createdById ?? actor?.employeeId ?? actor?.id ?? order.createdById ?? null,
    }));

    return this.attemptSquareCreation(link);
  }

  async retry(id: number, actor: any): Promise<ServiceOrderPaymentLink> {
    this.assertCanManage(actor);
    const link = await this.findOne(id);
    if (link.status !== 'failed') {
      throw new BadRequestException('Only failed payment links can be retried');
    }
    return this.attemptSquareCreation(link);
  }

  async remove(id: number, actor: any): Promise<ServiceOrderPaymentLink> {
    this.assertCanManage(actor);
    const link = await this.findOne(id);
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
    return this.paymentLinkRepository.save(link);
  }

  @Cron('0 */5 * * * *')
  async refreshPendingLinks(): Promise<void> {
    const links = await this.paymentLinkRepository.find({
      where: { status: 'pending' },
      order: { lastCheckedAt: 'ASC' },
      take: 100,
    });
    for (const link of links) {
      await this.safePaidCheck(link, false);
    }
  }

  private async attemptSquareCreation(link: ServiceOrderPaymentLink): Promise<ServiceOrderPaymentLink> {
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
    return this.paymentLinkRepository.save(link);
  }

  private async safePaidCheck(link: ServiceOrderPaymentLink, rethrow: boolean): Promise<boolean> {
    if (!link.squareOrderId) return false;
    try {
      const paid = await this.square.isOrderPaid(link.squareOrderId);
      link.lastCheckedAt = new Date();
      link.lastError = null;
      if (paid) {
        link.status = 'paid';
        link.paidAt = link.paidAt ?? new Date();
      }
      await this.paymentLinkRepository.save(link);
      return paid;
    } catch (error: any) {
      link.lastCheckedAt = new Date();
      link.lastError = this.errorMessage(error);
      await this.paymentLinkRepository.save(link);
      if (rethrow) throw error;
      return false;
    }
  }

  private async findOne(id: number): Promise<ServiceOrderPaymentLink> {
    const link = await this.paymentLinkRepository.findOne({ where: { id } });
    if (!link) throw new NotFoundException(`Payment link #${id} not found`);
    return link;
  }

  private errorMessage(error: any): string {
    const message = error?.response?.message ?? error?.message ?? 'Square request failed';
    return Array.isArray(message) ? message.join(', ') : String(message).slice(0, 2000);
  }
}
