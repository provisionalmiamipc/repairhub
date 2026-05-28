import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairStatus } from './entities/repair_status.entity';
import { CreateRepairStatusDto } from './dto/create-repair_status.dto';
import { UpdateRepairStatusDto } from './dto/update-repair_status.dto';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { EmailService } from '../common/email/email.service';
import { Warranty } from '../warranties/entities/warranty.entity';
import { ServiceOrdersService } from '../service_orders/service_orders.service';

@Injectable()
export class RepairStatusService {
  constructor(
    @InjectRepository(RepairStatus)
    private readonly repairStatusRepository: Repository<RepairStatus>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(Warranty)
    private readonly warrantyRepository: Repository<Warranty>,
    private readonly emailService: EmailService,
    private readonly serviceOrdersService: ServiceOrdersService,
  ) {}

  async create(createRepairStatusDto: CreateRepairStatusDto) {
    const repairStatus = this.repairStatusRepository.create({
      ...createRepairStatusDto,
    });

    // Count existing statuses for the order to decide whether to send email
    const serviceOrderId = createRepairStatusDto.serviceOrderId;
    const existingCount = await this.repairStatusRepository.count({ where: { serviceOrderId } });
    const previousStatus = await this.repairStatusRepository.findOne({
      where: { serviceOrderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });

    const saved = await this.repairStatusRepository.save(repairStatus);

    // Keep warranty automation isolated so a warranty issue never blocks status email delivery.
    void this.createWarrantyIfDeliveryStatus(saved, previousStatus).catch((err) => {
      console.error('RepairStatusService: failed to auto-create warranty', err);
    });

    // Non-blocking email dispatch to avoid delaying API response.
    if (existingCount > 0) {
      void this.dispatchRepairStatusEmail(saved, serviceOrderId, previousStatus).catch((err) => {
        console.error('RepairStatusService: failed to send status update email', err);
      });
    }

    return saved;
  }

  private async createWarrantyIfDeliveryStatus(saved: RepairStatus, previousStatus: RepairStatus | null): Promise<void> {
    if (!this.isWarrantyStartStatus(saved.status)) return;
    if (!this.isRepairedStatus(previousStatus?.status)) return;

    const order = await this.serviceOrderRepository.findOne({
      where: { id: saved.serviceOrderId },
    });
    if (!order) return;
    if (order.canceled || order.isWarrantyOrder) return;
    if (!order.warrantyDuration || Number(order.warrantyDuration) <= 0) return;

    const existing = await this.warrantyRepository.findOne({
      where: {
        serviceOrderId: order.id,
      },
      order: { createdAt: 'DESC' },
    });
    if (existing && existing.status !== 'void') return;

    const startDate = saved.createdAt || new Date();
    const duration = Number(order.warrantyDuration);
    const unit = order.warrantyDurationUnit || 'months';
    const warranty = this.warrantyRepository.create({
      centerId: order.centerId,
      storeId: order.storeId,
      serviceOrderId: order.id,
      customerId: order.customerId,
      deviceId: order.deviceId,
      serial: order.serial,
      status: 'active',
      warrantyDuration: duration,
      warrantyDurationUnit: unit,
      warrantyStartDate: startDate,
      warrantyEndDate: this.addDuration(startDate, duration, unit),
      coverageSummary: 'Limited repair warranty',
      createdById: saved.createdById ?? order.createdById ?? null,
    });

    await this.warrantyRepository.save(warranty);
  }

  private isWarrantyStartStatus(status?: string): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized === 'delivered' || normalized === 'pickup' || normalized === 'pick up' || normalized === 'picked up';
  }

  private isRepairedStatus(status?: string): boolean {
    return this.normalizeStatus(status) === 'repaired';
  }

  private normalizeStatus(status?: string): string {
    return String(status ?? '').trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  }

  private addDuration(date: Date, duration: number, unit: string): Date {
    const result = new Date(date);
    if (unit === 'days') result.setDate(result.getDate() + duration);
    else if (unit === 'years') result.setFullYear(result.getFullYear() + duration);
    else result.setMonth(result.getMonth() + duration);
    return result;
  }

  private async dispatchRepairStatusEmail(saved: RepairStatus, serviceOrderId: number, previousStatus: RepairStatus | null): Promise<void> {
    const order = await this.serviceOrderRepository.findOne({
      where: { id: serviceOrderId },
      relations: ['customer'],
    });
    const customer = (order && (order as any).customer) || null;
    const to = customer?.email || (order as any).customerEmail || null;
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : (order as any).customerName || '';

    if (!to) return;

    const orderCode = (order as any).orderCode || String(serviceOrderId);
    if (this.isWarrantyStartStatus(saved.status) && this.isRepairedStatus(previousStatus?.status)) {
      const pdfBuffer = await this.serviceOrdersService.generatePdf(serviceOrderId);
      await this.emailService.sendServiceCompletionNotification({
        to,
        customerName,
        orderCode,
        pdfBuffer,
      });
      return;
    }

    await this.emailService.sendRepairStatusUpdate({
      to,
      customerName,
      orderCode,
      status: saved.status,
      date: saved.createdAt || new Date(),
    });
  }

  async findAll() {
    return this.repairStatusRepository.find({ relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async findOne(id: number) {
    return this.repairStatusRepository.findOne({ where: { id }, relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async update(id: number, updateRepairStatusDto: UpdateRepairStatusDto) {
    const updateData: any = { ...updateRepairStatusDto };
    if ((updateRepairStatusDto as any).centerId) updateData.center = { id: (updateRepairStatusDto as any).centerId };
    if ((updateRepairStatusDto as any).storeId) updateData.store = { id: (updateRepairStatusDto as any).storeId };
    if ((updateRepairStatusDto as any).serviceOrderId) updateData.serviceOrder = { id: (updateRepairStatusDto as any).serviceOrderId };
    if ((updateRepairStatusDto as any).createdBy) updateData.createdBy = { id: (updateRepairStatusDto as any).createdBy };
    await this.repairStatusRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repairStatusRepository.delete(id);
    return { deleted: true };
  }
}
