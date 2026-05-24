import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { DeviceBrand } from '../device_brands/entities/device_brand.entity';
import { RepairStatus } from '../repair_status/entities/repair_status.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { CreateWarrantyOrderDto } from './dto/create-warranty-order.dto';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { VoidWarrantyDto } from './dto/void-warranty.dto';
import { Warranty } from './entities/warranty.entity';
import type { WarrantyDurationUnit } from './entities/warranty.entity';

@Injectable()
export class WarrantiesService {
  private readonly relations = ['serviceOrder', 'serviceOrder.device', 'serviceOrder.deviceBrand', 'customer', 'device', 'store', 'center', 'createdBy', 'voidedBy'];

  constructor(
    @InjectRepository(Warranty)
    private readonly repo: Repository<Warranty>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrdersRepo: Repository<ServiceOrder>,
    @InjectRepository(RepairStatus)
    private readonly repairStatusRepo: Repository<RepairStatus>,
  ) {}

  async create(dto: CreateWarrantyDto) {
    await this.ensureNoActiveWarranty(dto.serviceOrderId);
    const warrantyStartDate = dto.warrantyStartDate ? new Date(dto.warrantyStartDate) : new Date();
    const warrantyDuration = dto.warrantyDuration ?? 6;
    const warrantyDurationUnit = dto.warrantyDurationUnit ?? 'months';
    const warrantyEndDate = dto.warrantyEndDate
      ? new Date(dto.warrantyEndDate)
      : this.addDuration(warrantyStartDate, warrantyDuration, warrantyDurationUnit);

    const entity = this.repo.create({
      ...dto,
      status: dto.status ?? 'active',
      warrantyDuration,
      warrantyDurationUnit,
      warrantyStartDate,
      warrantyEndDate,
    });
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id);
  }

  async createFromServiceOrder(serviceOrderId: number, createdById?: number | null) {
    await this.ensureNoActiveWarranty(serviceOrderId);

    const order = await this.serviceOrdersRepo.findOne({ where: { id: serviceOrderId } });
    if (!order) throw new NotFoundException(`ServiceOrder #${serviceOrderId} not found`);
    if (order.canceled) throw new BadRequestException('Cannot create warranty for a canceled service order');
    if (!order.cloused) throw new BadRequestException('Warranty can only be created for completed service orders');
    if (!order.warrantyDuration || Number(order.warrantyDuration) <= 0) {
      throw new BadRequestException('Warranty duration must be greater than 0');
    }

    const warrantyStartDate = await this.resolveWarrantyStartDate(order.id);
    const warrantyDuration = order.warrantyDuration ?? 6;
    const warrantyDurationUnit = order.warrantyDurationUnit ?? 'months';

    return this.create({
      centerId: order.centerId,
      storeId: order.storeId,
      serviceOrderId: order.id,
      customerId: order.customerId,
      deviceId: order.deviceId,
      serial: order.serial,
      warrantyDuration,
      warrantyDurationUnit,
      warrantyStartDate: warrantyStartDate.toISOString(),
      warrantyEndDate: this.addDuration(warrantyStartDate, warrantyDuration, warrantyDurationUnit).toISOString(),
      coverageSummary: 'Limited repair warranty',
      createdById: createdById ?? order.createdById ?? null,
    });
  }

  async findAll() {
    const warranties = await this.repo
      .createQueryBuilder('warranty')
      .leftJoinAndSelect('warranty.serviceOrder', 'serviceOrder')
      .leftJoinAndSelect('serviceOrder.device', 'serviceOrderDevice')
      .leftJoinAndSelect('serviceOrder.deviceBrand', 'serviceOrderDeviceBrand')
      .leftJoinAndSelect('warranty.customer', 'customer')
      .leftJoinAndSelect('warranty.device', 'device')
      .leftJoinAndSelect('warranty.store', 'store')
      .leftJoinAndSelect('warranty.center', 'center')
      .leftJoinAndSelect('warranty.createdBy', 'createdBy')
      .leftJoinAndSelect('warranty.voidedBy', 'voidedBy')
      .orderBy('warranty.createdAt', 'DESC')
      .getMany();

    await this.ensureServiceOrderBrands(warranties);
    return warranties.map((warranty) => this.withComputedStatus(warranty));
  }

  async findOne(id: number) {
    const warranty = await this.repo.findOne({ where: { id }, relations: this.relations });
    if (!warranty) throw new NotFoundException('Warranty not found');
    await this.ensureServiceOrderBrands([warranty]);
    return this.withComputedStatus(warranty);
  }

  async findByServiceOrder(serviceOrderId: number) {
    const warranties = await this.repo.find({
      where: { serviceOrderId },
      relations: this.relations,
      order: { createdAt: 'DESC' },
    });
    await this.ensureServiceOrderBrands(warranties);
    return warranties.map((warranty) => this.withComputedStatus(warranty));
  }

  async update(id: number, dto: UpdateWarrantyDto) {
    const current = await this.findOne(id);
    const updateData: any = { ...dto };

    if (dto.warrantyStartDate) updateData.warrantyStartDate = new Date(dto.warrantyStartDate);
    if (dto.warrantyEndDate) updateData.warrantyEndDate = new Date(dto.warrantyEndDate);

    const duration = dto.warrantyDuration ?? current.warrantyDuration;
    const unit = dto.warrantyDurationUnit ?? current.warrantyDurationUnit;
    if ((dto.warrantyDuration || dto.warrantyDurationUnit || dto.warrantyStartDate) && !dto.warrantyEndDate) {
      updateData.warrantyEndDate = this.addDuration(updateData.warrantyStartDate ?? current.warrantyStartDate, duration, unit);
    }

    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async void(id: number, dto: VoidWarrantyDto) {
    const reason = dto.warrantyVoidReason?.trim();
    if (!reason) throw new BadRequestException('Warranty void reason is required');
    await this.repo.update(id, {
      status: 'void',
      warrantyVoidReason: reason,
      warrantyVoidNotes: dto.warrantyVoidNotes,
      voidedById: dto.voidedById ?? null,
      voidedAt: new Date(),
    });
    return this.findOne(id);
  }

  async createWarrantyOrder(id: number, dto: CreateWarrantyOrderDto = {}) {
    const warranty = await this.repo.findOne({
      where: { id },
      relations: ['serviceOrder'],
    });
    if (!warranty) throw new NotFoundException('Warranty not found');

    const status = this.withComputedStatus(warranty).status;
    if (status !== 'active') {
      throw new BadRequestException('Only active warranties can create warranty service orders');
    }

    const existing = await this.serviceOrdersRepo.findOne({
      where: {
        warrantyId: warranty.id,
        isWarrantyOrder: true,
        canceled: false,
        cloused: false,
      },
    });
    if (existing) {
      throw new BadRequestException('This warranty already has an open warranty service order');
    }

    const original = warranty.serviceOrder;
    if (!original) throw new NotFoundException('Original service order not found');

    const orderCode = await this.getNextOrderCode();
    const savedOrder = await this.serviceOrdersRepo.manager.transaction(async (manager) => {
      const order = manager.create(ServiceOrder, {
        centerId: original.centerId,
        storeId: original.storeId,
        customerId: original.customerId,
        deviceId: original.deviceId,
        deviceBrandId: original.deviceBrandId,
        model: original.model,
        defectivePart: 'Warranty claim',
        serial: original.serial,
        lock: false,
        price: 0,
        repairCost: 0,
        totalCost: 0,
        costdiscount: 0,
        advancePayment: 0,
        tax: original.tax ?? 0,
        paymentTypeId: original.paymentTypeId,
        assignedTechId: dto.assignedTechId ?? original.assignedTechId,
        createdById: dto.createdById ?? original.createdById,
        noteReception: dto.noteReception ?? `Warranty claim for original order ${original.orderCode}`,
        estimated: '',
        cloused: false,
        canceled: false,
        warrantyDuration: original.warrantyDuration ?? warranty.warrantyDuration,
        warrantyDurationUnit: original.warrantyDurationUnit ?? warranty.warrantyDurationUnit,
        isWarrantyOrder: true,
        originalServiceOrderId: original.id,
        warrantyId: warranty.id,
        warrantyDecision: 'pending',
        warrantyDecisionReason: null,
        orderCode,
      });
      const newOrder = await manager.save(order);

      const initialStatus = manager.create(RepairStatus, {
        centerId: newOrder.centerId,
        storeId: newOrder.storeId,
        serviceOrderId: newOrder.id,
        status: 'Warranty Review',
        createdById: newOrder.createdById,
      });
      await manager.save(initialStatus);

      return newOrder;
    });

    return this.serviceOrdersRepo.findOne({
      where: { id: savedOrder.id },
      relations: [
        'center',
        'store',
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        'paymentType',
        'repairStatus',
        'warranty',
        'originalServiceOrder',
      ],
    });
  }

  async remove(id: number) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Warranty not found');
    return { deleted: true };
  }

  private async ensureNoActiveWarranty(serviceOrderId: number) {
    const existing = await this.repo.findOne({
      where: {
        serviceOrderId,
        status: Not('void'),
        warrantyEndDate: MoreThanOrEqual(new Date()),
      },
    });
    if (existing) throw new BadRequestException('This service order already has an active warranty');
  }

  private addDuration(date: Date, duration: number, unit: WarrantyDurationUnit): Date {
    const result = new Date(date);
    if (unit === 'days') result.setDate(result.getDate() + duration);
    if (unit === 'months') result.setMonth(result.getMonth() + duration);
    if (unit === 'years') result.setFullYear(result.getFullYear() + duration);
    return result;
  }

  private withComputedStatus(warranty: Warranty) {
    if (warranty.status === 'active' && new Date(warranty.warrantyEndDate).getTime() < Date.now()) {
      return { ...warranty, status: 'expired' };
    }
    return warranty;
  }

  private async ensureServiceOrderBrands(warranties: Warranty[]) {
    const missingBrandIds = warranties
      .map((warranty) => warranty.serviceOrder)
      .filter((order): order is ServiceOrder => !!order && !!order.deviceBrandId && !order.deviceBrand)
      .map((order) => Number(order.deviceBrandId));

    const brandIds = [...new Set(missingBrandIds)];
    if (!brandIds.length) return;

    const brands = await this.repo.manager.getRepository(DeviceBrand).find({
      where: { id: In(brandIds) },
    });
    const brandsById = new Map(brands.map((brand) => [Number(brand.id), brand]));

    warranties.forEach((warranty) => {
      const order = warranty.serviceOrder;
      if (!order || order.deviceBrand || !order.deviceBrandId) return;
      const brand = brandsById.get(Number(order.deviceBrandId));
      if (brand) order.deviceBrand = brand;
    });
  }

  private async getNextOrderCode(): Promise<string> {
    const lastOrder = await this.serviceOrdersRepo.createQueryBuilder('so')
      .orderBy('so.orderCode', 'DESC')
      .where('so.orderCode LIKE :prefix', { prefix: 'SO%' })
      .getOne();

    let nextNumber = 1;
    if (lastOrder?.orderCode) {
      const match = lastOrder.orderCode.match(/SO(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }

    return `SO${nextNumber.toString().padStart(5, '0')}`;
  }

  private async resolveWarrantyStartDate(serviceOrderId: number): Promise<Date> {
    const status = await this.repairStatusRepo.findOne({
      where: { serviceOrderId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    if (status && this.isWarrantyStartStatus(status.status)) {
      return status.createdAt || new Date();
    }
    return new Date();
  }

  private isWarrantyStartStatus(status?: string): boolean {
    const normalized = String(status ?? '').trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
    return normalized === 'delivered' || normalized === 'pickup' || normalized === 'pick up' || normalized === 'picked up';
  }
}
