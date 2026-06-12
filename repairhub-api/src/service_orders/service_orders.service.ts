import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ServiceOrderPdfService } from './pdf.service';
import { ServiceOrderPuppeteerPdfService } from './puppeteer-pdf.service';
import { ServiceOrderMailService } from './mail.service';
import { ServiceOrderPdfJobService } from './pdf-job.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from './entities/service_order.entity';
import { RepairStatus } from '../repair_status/entities/repair_status.entity';
import { CreateServiceOrderDto } from './dto/create-service_order.dto';
import { UpdateServiceOrderDto } from './dto/update-service_order.dto';
import { ReceivedPart } from '../received-parts/entities/received-part.entity';
import { MediaService } from '../media/media.service';
import { Warranty } from '../warranties/entities/warranty.entity';
import type { WarrantyDurationUnit } from '../warranties/entities/warranty.entity';
import { EmailService } from '../common/email/email.service';
import { ServiceOrderPaymentLinksService } from './service-order-payment-links.service';


@Injectable()
export class ServiceOrdersService {
  private readonly mediaOwnerType = 'service_order';

  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(RepairStatus)
    private readonly repairStatusRepository: Repository<RepairStatus>,
    private readonly pdfService: ServiceOrderPdfService,
    private readonly mailService: ServiceOrderMailService,
    private readonly emailService: EmailService,
    @Optional() private readonly puppeteerPdfService?: ServiceOrderPuppeteerPdfService,
    private readonly pdfJobService?: ServiceOrderPdfJobService,
    private readonly mediaService?: MediaService,
    private readonly paymentLinksService?: ServiceOrderPaymentLinksService,
  ) {}

  formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

formatDateToMMDDYYYY(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0-11
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

  private pickLastRepairStatus(order: ServiceOrder): { id: number; status: string; date: Date } | null {
    const statuses = Array.isArray((order as any).repairStatus) ? (order as any).repairStatus : [];
    if (!statuses.length) return null;

    const sorted = [...statuses].sort((a: any, b: any) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const last = sorted[sorted.length - 1];
    if (!last) return null;

    return {
      id: last.id,
      status: last.status || '',
      date: last.createdAt,
    };
  }

  private attachLastRepairStatus(orders: ServiceOrder[]): any[] {
    return (orders || []).map((order) => ({
      ...order,
      lastRepairStatus: this.pickLastRepairStatus(order),
    }));
  }

  private normalizeRepairStatus(status?: string): string {
    return String(status ?? '').trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  }

  private isDeliveryStatus(status?: string): boolean {
    const normalized = this.normalizeRepairStatus(status);
    return normalized === 'delivered' || normalized === 'pickup' || normalized === 'pick up' || normalized === 'picked up';
  }

  private isRepairedStatus(status?: string): boolean {
    return this.normalizeRepairStatus(status) === 'repaired';
  }

  private shouldShowWarrantyPolicy(statuses: RepairStatus[]): boolean {
    if (!Array.isArray(statuses) || statuses.length < 2) return false;

    const sorted = [...statuses].sort((a: any, b: any) => {
      const byDate = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return byDate || Number(a.id || 0) - Number(b.id || 0);
    });
    const previous = sorted[sorted.length - 2];
    const current = sorted[sorted.length - 1];

    return this.isDeliveryStatus(current?.status) && this.isRepairedStatus(previous?.status);
  }

  async create(createDto: CreateServiceOrderDto) {
    const { paymentLinkRequests = [], ...serviceOrderData } = createDto;
    // Obtener el último orderCode
    const lastOrder = await this.serviceOrderRepository.createQueryBuilder('so')
      .orderBy('so.orderCode', 'DESC')
      .where('so.orderCode LIKE :prefix', { prefix: 'SO%' })
      .getOne();

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderCode) {
      const match = lastOrder.orderCode.match(/SO(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const orderCode = `SO${nextNumber.toString().padStart(5, '0')}`;

    // Use a transaction to create service order, initial repair status and any received parts atomically
    const savedOrder = await this.serviceOrderRepository.manager.transaction(async (manager) => {
      const entity = manager.create(ServiceOrder, { ...serviceOrderData, orderCode });
      const order = await manager.save(entity);

      // Create initial repair status for the new service order
      try {
        const initialStatus = manager.create(RepairStatus, {
          centerId: order.centerId,
          storeId: order.storeId,
          serviceOrderId: order.id,
          status: 'Pending',
          createdById: order.createdById,
        });
        await manager.save(initialStatus);
      } catch (err) {
        // swallow errors for initial status
      }

      // Create received parts if provided
      if (serviceOrderData.receivedParts && Array.isArray(serviceOrderData.receivedParts) && serviceOrderData.receivedParts.length) {
        const partsRepo = manager.getRepository(ReceivedPart);
        const normalizeId = (v: any) => {
          if (v === undefined || v === null) return null;
          const n = Number(v);
          return Number.isFinite(n) && n > 0 ? n : null;
        };
        const partsToSave = serviceOrderData.receivedParts.map(p => ({
          accessory: p.accessory,
          observations: p.observations ?? null,
          createdById: normalizeId(p.createdById) ?? normalizeId(order.createdById) ?? null,
          serviceOrderId: order.id,
          centerId: p.centerId ?? order.centerId,
          storeId: p.storeId ?? order.storeId,
        }));
        await partsRepo.save(partsToSave as any);
      }

      return order;
    });

    // Recuperar la orden con relaciones completas
    const fullOrder = await this.serviceOrderRepository.findOne({
      where: { id: savedOrder.id },
      relations: [
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        'paymentType',
        'soitems',
        'soitems.item',
        'sonotes',
        'sodiagnostic',
        'repairStatus',
        'receivedParts',
        'warranties',
        'warranty',
        'originalServiceOrder',
        'paymentLinks'
      ],
    });

    // Preparar datos para PDF y correo
    if (!fullOrder) {
      throw new NotFoundException('Service order not found after saving.');
    }
      if (this.paymentLinksService && paymentLinkRequests.length) {
        await Promise.all(paymentLinkRequests.map(request =>
          this.paymentLinksService!.create(
            fullOrder.id,
            {
              ...request,
              title: this.paymentLinkTitle(fullOrder, request.concept, request.title),
            },
            undefined,
            fullOrder.createdById,
          )
        ));
        fullOrder.paymentLinks = await this.paymentLinksService.findByServiceOrder(fullOrder.id);
      }
     const lastRepairStatus = (fullOrder.repairStatus && (Array.isArray(fullOrder.repairStatus)
      ? fullOrder.repairStatus[fullOrder.repairStatus.length - 1]
      : fullOrder.repairStatus)) || null;
      const financials = this.calculateFinancials(fullOrder);
      const pdfData = {
        orderCode: fullOrder.orderCode,
        customerName: fullOrder.customer ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}` : '',
        customerEmail: fullOrder.customer?.email || '',
        customerPhone: fullOrder.customer?.phone || fullOrder.customer?.phone || '---',
        customerAddress: fullOrder.customer ? `${fullOrder.customer.city || ''}` : '---',
        date: this.formatDateToMMDDYYYY(fullOrder.createdAt || new Date()),
        device: fullOrder.device?.name || '',
        brand: fullOrder.deviceBrand?.name || '',
        model: fullOrder.model || '-',
        serial: fullOrder.serial || '-',
        defectivePart: fullOrder.defectivePart || '---',
        price: fullOrder.price || 0,
        repairCost: fullOrder.repairCost || 0,
        advancePayment: fullOrder.advancePayment || 0,
        warrantyDuration: fullOrder.warrantyDuration || 0,
        warrantyDurationUnit: fullOrder.warrantyDurationUnit || 'months',
        tax: financials.taxAmount,
        taxPercent: financials.taxPercent,
        discount: financials.discountAmount,
        total: financials.total,
        paymentType: fullOrder.paymentType?.type || '',
        assignedTech: fullOrder.assignedTech ? `${fullOrder.assignedTech.firstName} ${fullOrder.assignedTech.lastName}` : '',
        createdBy: fullOrder.employee ? `${fullOrder.employee.firstName} ${fullOrder.employee.lastName}` : '',
        estimated: fullOrder.estimated || '',
        noteReception: fullOrder.noteReception || '',
        terms: '',
        lastrepairStatus: lastRepairStatus ? ({
          id: lastRepairStatus.id,
          status: lastRepairStatus.status || '',          
          date: this.formatDateToMMDDYYYY(lastRepairStatus.createdAt) || '',
        }) : null,
        repairStatus: (fullOrder.repairStatus || [])
          .map(rs => ({
            id: rs.id,
            status: rs.status || '',
            date: this.formatDateToMMDDYYYY(rs.createdAt) || '',
          })),
        diagnostics: (fullOrder.sodiagnostic || [])
          .filter(d => d.sendEmail === true)
          .map(d => ({
            id: d.id,
            title: d.diagnostic || '',
            sendEmail: d.sendEmail || '',
            date: this.formatDateToMMDDYYYY(d.createdAt ) || '',
          })),
        items: (fullOrder.soitems || []).map(it => ({
          description: it.item?.product || it.note || '',
          quantity: it.quantity || 1,
          price: it.price || it.cost || 0,
          discount: it.discount || 0,
        })),
        receivedParts: (fullOrder.receivedParts || []).map(rp => ({
          accessory: rp.accessory || '',
          observations: rp.observations || '',
        })),
        paymentLinks: this.pendingPdfLinks(fullOrder.paymentLinks),
      };
      // Enqueue PDF generation + email send to background job for faster response
      if (this.pdfJobService) {
        this.pdfJobService.enqueue({ pdfData });
      } else {
        // Fallback: do it synchronously if job service is missing
        let pdfBuffer: Buffer;
        // prefer pdfkit buffer generator to avoid Chromium dependency and speed up
        if (this.pdfService && typeof (this.pdfService as any).generateRepairPdfBuffer === 'function') {
          pdfBuffer = await (this.pdfService as any).generateRepairPdfBuffer(pdfData);
        } else if (this.puppeteerPdfService) {
          pdfBuffer = await this.puppeteerPdfService.generate(pdfData);
        } else {
          pdfBuffer = await this.pdfService.generate(pdfData) as unknown as Buffer;
        }
        if (pdfData.customerEmail) {
          await this.mailService.sendOrderCreatedMail(pdfData, pdfBuffer);
        }
      }

    return fullOrder;
  }

  async createWithImages(
    createDto: CreateServiceOrderDto,
    images: Express.Multer.File[] = [],
    imageKinds: string[] = [],
    actor?: any,
  ) {
    if (createDto.paymentLinkRequests?.length) {
      this.paymentLinksService?.assertCanManage(actor);
    }
    if (this.mediaService) {
      await this.mediaService.validateImageChange({
        ownerType: this.mediaOwnerType,
        files: images,
      });
    }

    const order = await this.create(createDto);

    if (images.length && this.mediaService) {
      await this.mediaService.createImageAssets({
        ownerType: this.mediaOwnerType,
        ownerId: order.id,
        files: images,
        kinds: imageKinds,
      });
    }

    return this.findOne(order.id);
  }

  async findAll(user?: any, customerId?: number) {
    const relations = [
      'center',
      'store',
      'customer',
      'device',
      'deviceBrand',
      'assignedTech',
      'employee',
      'paymentType',
      'soitems',
      'soitems.item',
      'sonotes',
      'sodiagnostic',
      'repairStatus',
      'receivedParts',
      'warranties',
      'warranty',
      'originalServiceOrder',
      'paymentLinks'
    ];
    const customerWhere = customerId ? { customerId } : {};

    // If caller provides an authenticated user who is an Expert and NOT a center admin,
    // return only service orders created by them or assigned to them.
    try {
      const empType = user?.employee_type ?? user?.type ?? user?.role;
      const empId = user?.employeeId ?? user?.sub ?? user?.id;
      const isCenterAdmin = !!user?.isCenterAdmin;

      if (empType === 'Expert' && !isCenterAdmin && empId) {
        const orders = await this.serviceOrderRepository.find({
          where: [
            { ...customerWhere, createdById: empId },
            { ...customerWhere, assignedTechId: empId },
          ],
          relations,
        });
        const withStatus = this.attachLastRepairStatus(orders);
        return this.mediaService
          ? this.mediaService.attachImages(this.mediaOwnerType, withStatus)
          : withStatus;
      }
    } catch (err) {
      // fallback to full list if any error inspecting user
    }

    const orders = await this.serviceOrderRepository.find({
      where: customerWhere,
      relations,
    });
    const withStatus = this.attachLastRepairStatus(orders);
    return this.mediaService
      ? this.mediaService.attachImages(this.mediaOwnerType, withStatus)
      : withStatus;
  }

  async findOne(id: number) {
    const entity = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: [
        'center',
        'store',
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        'paymentType',
        'soitems',
        'soitems.item',
        'sonotes',
        'sodiagnostic',
        'repairStatus',
        'receivedParts',
        'warranties',
        'warranty',
        'originalServiceOrder',
        'paymentLinks'
      ],
    });
    if (!entity) throw new NotFoundException(`ServiceOrder #${id} not found`);
    return this.mediaService
      ? this.mediaService.attachImages(this.mediaOwnerType, entity)
      : entity;
  }

  async update(id: number, updateDto: UpdateServiceOrderDto) {
    const entity = await this.serviceOrderRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`ServiceOrder #${id} not found`);
    const updateData: any = { ...updateDto };
    if (updateDto.centerId !== undefined) updateData.center = { id: updateDto.centerId };
    if (updateDto.storeId !== undefined) updateData.store = { id: updateDto.storeId };
    if (updateDto.customerId !== undefined) updateData.customer = { id: updateDto.customerId };
    if (updateDto.deviceId !== undefined) updateData.device = { id: updateDto.deviceId };
    if (updateDto.deviceBrandId !== undefined) updateData.deviceBrand = { id: updateDto.deviceBrandId };
    delete updateData.centerId;
    delete updateData.storeId;
    delete updateData.customerId;
    delete updateData.deviceId;
    delete updateData.deviceBrandId;
    await this.serviceOrderRepository.update(id, updateData);
    await this.syncWarrantyDurationAfterOrderUpdate(id, updateDto);
    return this.findOne(id);
  }

  private async syncWarrantyDurationAfterOrderUpdate(id: number, updateDto: UpdateServiceOrderDto) {
    if (updateDto.warrantyDuration === undefined && updateDto.warrantyDurationUnit === undefined) {
      return;
    }

    const order = await this.serviceOrderRepository.findOne({ where: { id } });
    if (!order) return;

    const warrantyRepo = this.serviceOrderRepository.manager.getRepository(Warranty);
    const warranties = await warrantyRepo.find({
      where: { serviceOrderId: id },
      order: { createdAt: 'DESC' },
    });

    const warranty = warranties.find((warranty) => warranty.status !== 'void');
    if (!warranty) return;

    const duration = Number(order.warrantyDuration ?? 0);
    if (!Number.isFinite(duration) || duration < 0) {
      return;
    }

    const unit = (order.warrantyDurationUnit || 'months') as WarrantyDurationUnit;
    const startDate = warranty.warrantyStartDate || new Date();
    const warrantyEndDate = this.addWarrantyDuration(startDate, duration, unit);

    await warrantyRepo.update(warranty.id, {
      warrantyDuration: duration,
      warrantyDurationUnit: unit,
      warrantyEndDate,
    });

  }

  private addWarrantyDuration(date: Date, duration: number, unit: WarrantyDurationUnit): Date {
    const result = new Date(date);
    if (unit === 'days') result.setDate(result.getDate() + duration);
    else if (unit === 'years') result.setFullYear(result.getFullYear() + duration);
    else result.setMonth(result.getMonth() + duration);
    return result;
  }

  async updateWithImages(
    id: number,
    updateDto: UpdateServiceOrderDto,
    images: Express.Multer.File[] = [],
    deleteImageIds: number[] = [],
    imageKinds: string[] = [],
  ) {
    if (this.mediaService) {
      await this.mediaService.validateImageChange({
        ownerType: this.mediaOwnerType,
        ownerId: id,
        files: images,
        deleteImageIds,
      });
    }

    await this.update(id, updateDto);

    if (this.mediaService) {
      await this.mediaService.deleteByIds(
        this.mediaOwnerType,
        id,
        deleteImageIds,
      );

      if (images.length) {
        await this.mediaService.createImageAssets({
          ownerType: this.mediaOwnerType,
          ownerId: id,
          files: images,
          kinds: imageKinds,
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.serviceOrderRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`ServiceOrder #${id} not found`);
    return { deleted: true };
  }

  async generatePdf(id: number): Promise<Buffer> {
    const fullOrder = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        'paymentType',
        'soitems',
        'soitems.item',
        'sonotes',
        'sodiagnostic',
        'repairStatus',
        'receivedParts',
        'paymentLinks',
      ],
    });

    if (!fullOrder) throw new NotFoundException(`ServiceOrder #${id} not found`);

    const repairStatuses = Array.isArray(fullOrder.repairStatus)
      ? [...fullOrder.repairStatus].sort((a: any, b: any) => {
        const byDate = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return byDate || Number(a.id || 0) - Number(b.id || 0);
      })
      : [];
    const lastRepairStatus = repairStatuses.length ? repairStatuses[repairStatuses.length - 1] : null;

    const financials = this.calculateFinancials(fullOrder);
    const pdfData = {
      orderCode: fullOrder.orderCode,
      customerName: fullOrder.customer ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}` : '',
      customerEmail: fullOrder.customer?.email || '',
      customerPhone: fullOrder.customer?.phone || fullOrder.customer?.phone || '',
      customerAddress: fullOrder.customer ? `${fullOrder.customer.city || ''}` : '',
      date: this.formatDateToMMDDYYYY(fullOrder.createdAt) || '',
      device: fullOrder.device?.name || '-',
      brand: fullOrder.deviceBrand?.name || '',
      model: fullOrder.model || '-',
      serial: fullOrder.serial || '',
      defectivePart: fullOrder.defectivePart || '-',
      price: fullOrder.price || 0,
      repairCost: fullOrder.repairCost || 0,
      advancePayment: fullOrder.advancePayment || 0,
      warrantyDuration: fullOrder.warrantyDuration || 0,
      warrantyDurationUnit: fullOrder.warrantyDurationUnit || 'months',
      tax: financials.taxAmount,
      taxPercent: financials.taxPercent,
      discount: financials.discountAmount,
      total: financials.total,
      paymentType: fullOrder.paymentType?.type || '',
      assignedTech: fullOrder.assignedTech ? `${fullOrder.assignedTech.firstName} ${fullOrder.assignedTech.lastName}` : '',
      createdBy: fullOrder.employee ? `${fullOrder.employee.firstName} ${fullOrder.employee.lastName}` : '',
      estimated: fullOrder.estimated || '',
      noteReception: fullOrder.noteReception || '',
      terms: '',
      showWarrantyPolicy: this.shouldShowWarrantyPolicy(repairStatuses),
      lastrepairStatus: lastRepairStatus ? ({
        id: lastRepairStatus.id,
        status: lastRepairStatus.status || '',
        date: this.formatDateToMMDDYYYY(lastRepairStatus.createdAt) || '',
      }) : null,
      repairStatus: repairStatuses.map(rs => ({
        id: rs.id,
        status: rs.status || '',
        date: this.formatDateToMMDDYYYY(rs.createdAt) || '',
      })),
      diagnostics: (fullOrder.sodiagnostic || [])
        .filter(d => d.sendEmail === true)
        .map(d => ({
          id: d.id,
          title: d.diagnostic || '',
          sendEmail: d.sendEmail || '',
          date: this.formatDateToMMDDYYYY(d.createdAt) || '',
        })),
      items: (fullOrder.soitems || []).map(it => ({
        description: it.item?.product || it.note || '',
        quantity: it.quantity || 1,
        price: it.price || it.cost || 0,
        discount: it.discount || 0,
      })),
      receivedParts: (fullOrder.receivedParts || []).map(rp => ({
        accessory: rp.accessory || '',
        observations: rp.observations || '',
      })),
      serviceOrderImages: this.mediaService
        ? await this.mediaService.getPdfImageBuffers(this.mediaOwnerType, fullOrder.id)
        : [],
      paymentLinks: this.pendingPdfLinks(fullOrder.paymentLinks),
    };

    if (this.pdfService && typeof (this.pdfService as any).generateRepairPdfBuffer === 'function') {
      return (this.pdfService as any).generateRepairPdfBuffer(pdfData);
    }

    if (this.puppeteerPdfService) {
      return this.puppeteerPdfService.generate(pdfData);
    }

    return this.pdfService.generate(pdfData) as unknown as Buffer;
  }

  async resendEmail(id: number) {
    const fullOrder = await this.serviceOrderRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        'paymentType',
        'soitems',
        'soitems.item',
        'sonotes',
        'sodiagnostic',
        'repairStatus',
        'receivedParts',
        'paymentLinks'
      ],
    });

    if (!fullOrder) throw new NotFoundException(`ServiceOrder #${id} not found`);

    const repairStatuses = Array.isArray(fullOrder.repairStatus)
      ? [...fullOrder.repairStatus].sort((a: any, b: any) => {
        const byDate = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return byDate || Number(a.id || 0) - Number(b.id || 0);
      })
      : [];
    const lastRepairStatus = repairStatuses.length ? repairStatuses[repairStatuses.length - 1] : null;
    const shouldSendCompletionEmail = this.shouldShowWarrantyPolicy(repairStatuses);

    const financials = this.calculateFinancials(fullOrder);
    const pdfData = {
      orderCode: fullOrder.orderCode,
      customerName: fullOrder.customer ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}` : '',
      customerEmail: fullOrder.customer?.email || '',
      customerPhone: fullOrder.customer?.phone || fullOrder.customer?.phone || '',
      customerAddress: fullOrder.customer ? `${fullOrder.customer.city || ''}` : '',
      date: this.formatDateToMMDDYYYY(fullOrder.createdAt) || '',
      device: fullOrder.device?.name || '-',
      brand: fullOrder.deviceBrand?.name || '',
      model: fullOrder.model || '-',
      serial: fullOrder.serial || '',
      defectivePart: fullOrder.defectivePart || '-',
      price: fullOrder.price || 0,
      repairCost: fullOrder.repairCost || 0,
      advancePayment: fullOrder.advancePayment || 0,
      warrantyDuration: fullOrder.warrantyDuration || 0,
      warrantyDurationUnit: fullOrder.warrantyDurationUnit || 'months',
      tax: financials.taxAmount,
      taxPercent: financials.taxPercent,
      discount: financials.discountAmount,
      total: financials.total,
      paymentType: fullOrder.paymentType?.type || '',
      assignedTech: fullOrder.assignedTech ? `${fullOrder.assignedTech.firstName} ${fullOrder.assignedTech.lastName}` : '',
      createdBy: fullOrder.employee ? `${fullOrder.employee.firstName} ${fullOrder.employee.lastName}` : '',
      estimated: fullOrder.estimated || '',
      noteReception: fullOrder.noteReception || '',
      terms: '',
      showWarrantyPolicy: shouldSendCompletionEmail,
      lastrepairStatus: lastRepairStatus ? ({
        id: lastRepairStatus.id,
        status: lastRepairStatus.status || '',
        date: this.formatDateToMMDDYYYY(lastRepairStatus.createdAt) || '',
      }) : null,
      repairStatus: repairStatuses
          .map(rs => ({
            id: rs.id,
            status: rs.status || '',
            date: this.formatDateToMMDDYYYY(rs.createdAt) || '',
          })),
      diagnostics: (fullOrder.sodiagnostic || [])
        .filter(d => d.sendEmail === true)
        .map(d => ({
          id: d.id,
          title: d.diagnostic || '',
          sendEmail: d.sendEmail || '',
          date: this.formatDateToMMDDYYYY(d.createdAt) || '',
        })),
      items: (fullOrder.soitems || []).map(it => ({
        description: it.item?.product || it.note || '',
        quantity: it.quantity || 1,
        price: it.price || it.cost || 0,
        discount: it.discount || 0,
      })),
        receivedParts: (fullOrder.receivedParts || []).map(rp => ({
          accessory: rp.accessory || '',
          observations: rp.observations || '',
        })),
      serviceOrderImages: this.mediaService
        ? await this.mediaService.getPdfImageBuffers(this.mediaOwnerType, fullOrder.id)
        : [],
      paymentLinks: this.pendingPdfLinks(fullOrder.paymentLinks),
    };

    if (shouldSendCompletionEmail) {
      const pdfBuffer = await this.generatePdfBufferFromData(pdfData);
      if (pdfData.customerEmail) {
        await this.emailService.sendServiceCompletionNotification({
          to: pdfData.customerEmail,
          customerName: pdfData.customerName,
          orderCode: pdfData.orderCode,
          pdfBuffer,
        });
      }
      return { ok: true, queued: false, completionEmail: true };
    }

    if (this.pdfJobService) {
      this.pdfJobService.enqueue({ pdfData });
      return { ok: true, queued: true };
    }

    // Fallback: generate PDF synchronously and send
    const pdfBuffer = await this.generatePdfBufferFromData(pdfData);

    if (pdfData.customerEmail) {
      await this.mailService.sendOrderCreatedMail(pdfData, pdfBuffer);
    }

    return { ok: true, queued: false };
  }

  private async generatePdfBufferFromData(pdfData: any): Promise<Buffer> {
    if (this.pdfService && typeof (this.pdfService as any).generateRepairPdfBuffer === 'function') {
      return (this.pdfService as any).generateRepairPdfBuffer(pdfData);
    }

    if (this.puppeteerPdfService) {
      return this.puppeteerPdfService.generate(pdfData);
    }

    return this.pdfService.generate(pdfData) as unknown as Buffer;
  }

  private calculateFinancials(order: ServiceOrder) {
    const price = Number(order.price || 0);
    const discountPercent = Number(order.costdiscount || 0);
    const taxPercent = Number(order.tax || 0);
    const discountAmount = this.money(price * discountPercent / 100);
    const subtotal = this.money(price - discountAmount);
    const taxAmount = this.money(subtotal * taxPercent / 100);
    return {
      discountAmount,
      taxAmount,
      taxPercent,
      total: this.money(subtotal + taxAmount),
    };
  }

  private pendingPdfLinks(links: any[] | undefined) {
    return (links || [])
      .filter(link => link.status === 'pending' && link.url)
      .map(link => ({
        title: link.title,
        amount: Number(link.amount || 0) / 100,
        url: link.url,
      }));
  }

  private money(value: number): number {
    return Number((Number.isFinite(value) ? value : 0).toFixed(2));
  }

  private paymentLinkTitle(order: ServiceOrder, concept: string, customTitle: string): string {
    const labels: Record<string, string> = {
      total: 'Total',
      advance_payment: 'Advance payment',
      pending_payment: 'Pending payment',
      pickup: 'Pick up',
      delivery: 'Delivery',
      custom: customTitle?.trim() || 'Custom',
    };
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
      : 'Customer';
    const deviceName = `${order.deviceBrand?.name || 'Device'} ${order.model || ''}`.trim();
    return `${customerName} - ${deviceName} - ${labels[concept] || customTitle} - ${order.orderCode}`;
  }
}
