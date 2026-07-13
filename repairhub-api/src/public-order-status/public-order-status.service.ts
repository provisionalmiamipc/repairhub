import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { TrackServiceOrderDto } from './dto/track-service-order.dto';
import { PublicServiceOrderStatusDto } from './dto/public-service-order-status.dto';

interface AttemptRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicOrderStatusService {
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly lookupWindowMs = 10 * 60 * 1000;
  private readonly maxAttemptsPerWindow = 12;
  private readonly genericNotFoundMessage = 'We could not find an order matching those details.';

  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
  ) {}

  async track(dto: TrackServiceOrderDto, ipAddress = 'unknown'): Promise<PublicServiceOrderStatusDto> {
    this.assertWithinRateLimit(ipAddress);

    const orderCode = this.normalizeOrderCode(dto.orderNumber);
    const contact = String(dto.contact ?? '').trim();

    if (!orderCode || !contact) {
      throw new NotFoundException(this.genericNotFoundMessage);
    }

    const order = await this.serviceOrderRepository.findOne({
      where: { orderCode },
      relations: [
        'customer',
        'device',
        'deviceBrand',
        'sodiagnostic',
        'repairStatus',
        'receivedParts',
        'warranties',
      ],
    });

    if (!order || !this.contactMatches(order, contact)) {
      throw new NotFoundException(this.genericNotFoundMessage);
    }

    return this.toPublicDto(order);
  }

  normalizeOrderCode(value: string): string | null {
    const compact = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!compact) return null;

    const explicitMatch = compact.match(/SO0*(\d{1,12})/);
    const numericMatch = compact.match(/^0*(\d{1,12})$/);
    const numberPart = explicitMatch?.[1] ?? numericMatch?.[1];

    if (!numberPart) return null;

    return `SO${numberPart.padStart(5, '0')}`;
  }

  private assertWithinRateLimit(ipAddress: string) {
    const now = Date.now();
    const key = ipAddress || 'unknown';
    const current = this.attempts.get(key);

    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.lookupWindowMs });
      return;
    }

    current.count += 1;
    if (current.count > this.maxAttemptsPerWindow) {
      throw new HttpException(
        'Too many attempts. Please try again in a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private contactMatches(order: ServiceOrder, rawContact: string): boolean {
    const customer = order.customer;
    if (!customer) return false;

    const contactEmail = this.normalizeEmail(rawContact);
    const customerEmail = this.normalizeEmail(customer.email ?? '');
    if (contactEmail && customerEmail && contactEmail === customerEmail) {
      return true;
    }

    const contactPhone = this.normalizePhone(rawContact);
    const customerPhone = this.normalizePhone(customer.phone ?? '');
    return !!contactPhone && !!customerPhone && contactPhone === customerPhone;
  }

  private normalizeEmail(value: string): string {
    const trimmed = String(value ?? '').trim().toLowerCase();
    return trimmed.includes('@') ? trimmed : '';
  }

  private normalizePhone(value: string): string {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length < 7) return '';
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  private toPublicDto(order: ServiceOrder): PublicServiceOrderStatusDto {
    const timeline = [...(order.repairStatus ?? [])]
      .sort((a, b) => this.dateTime(a.createdAt) - this.dateTime(b.createdAt))
      .map((status) => ({
        status: status.status || 'Pending',
        date: this.toIsoDate(status.createdAt),
      }));

    const currentStatus = order.canceled
      ? 'Canceled'
      : order.cloused
        ? 'Closed'
        : timeline[timeline.length - 1]?.status ?? 'Pending';

    const activeWarranty = [...(order.warranties ?? [])]
      .filter((warranty) => warranty.status === 'active')
      .sort((a, b) => this.dateTime(b.createdAt) - this.dateTime(a.createdAt))[0];

    return {
      orderCode: order.orderCode,
      createdAt: this.toIsoDate(order.createdAt),
      updatedAt: this.toIsoDate(order.updatedAt),
      currentStatus,
      isClosed: !!order.cloused,
      isCanceled: !!order.canceled,
      device: {
        type: order.device?.name || 'Device',
        brand: order.deviceBrand?.name || '',
        model: order.model || '',
        serialMasked: this.maskSerial(order.serial),
      },
      reportedIssue: order.defectivePart || '',
      timeline,
      diagnostics: [...(order.sodiagnostic ?? [])]
        .filter((diagnostic) => diagnostic.sendEmail === true)
        .sort((a, b) => this.dateTime(a.createdAt) - this.dateTime(b.createdAt))
        .map((diagnostic) => ({
          title: diagnostic.diagnostic || '',
          date: this.toIsoDate(diagnostic.createdAt),
        })),
      receivedParts: (order.receivedParts ?? []).map((part) => ({
        accessory: part.accessory || '',
        observations: part.observations || null,
      })),
      warranty: activeWarranty
        ? {
            available: true,
            duration: `${activeWarranty.warrantyDuration} ${activeWarranty.warrantyDurationUnit}`,
            endDate: this.toIsoDate(activeWarranty.warrantyEndDate),
          }
        : {
            available: Number(order.warrantyDuration ?? 0) > 0,
            duration: Number(order.warrantyDuration ?? 0) > 0
              ? `${order.warrantyDuration} ${order.warrantyDurationUnit || 'months'}`
              : undefined,
            endDate: null,
          },
    };
  }

  private maskSerial(serial?: string | null): string {
    const clean = String(serial ?? '').trim();
    if (!clean) return 'Not provided';
    if (clean.length <= 4) return '****';
    return `${'*'.repeat(Math.min(clean.length - 4, 8))}${clean.slice(-4)}`;
  }

  private toIsoDate(value?: Date | string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private dateTime(value?: Date | string | null): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}
