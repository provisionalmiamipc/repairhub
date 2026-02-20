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


@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(RepairStatus)
    private readonly repairStatusRepository: Repository<RepairStatus>,
    private readonly pdfService: ServiceOrderPdfService,
    private readonly mailService: ServiceOrderMailService,
    @Optional() private readonly puppeteerPdfService?: ServiceOrderPuppeteerPdfService,
    private readonly pdfJobService?: ServiceOrderPdfJobService,
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

  async create(createDto: CreateServiceOrderDto) {
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
      const entity = manager.create(ServiceOrder, { ...createDto, orderCode });
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
      if (createDto.receivedParts && Array.isArray(createDto.receivedParts) && createDto.receivedParts.length) {
        const partsRepo = manager.getRepository(ReceivedPart);
        const normalizeId = (v: any) => {
          if (v === undefined || v === null) return null;
          const n = Number(v);
          return Number.isFinite(n) && n > 0 ? n : null;
        };
        const partsToSave = createDto.receivedParts.map(p => ({
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
        'receivedParts'
      ],
    });

    // Preparar datos para PDF y correo
    if (!fullOrder) {
      throw new NotFoundException('Service order not found after saving.');
    }
     const lastRepairStatus = (fullOrder.repairStatus && (Array.isArray(fullOrder.repairStatus)
      ? fullOrder.repairStatus[fullOrder.repairStatus.length - 1]
      : fullOrder.repairStatus)) || null;
      const pdfData = {
        orderCode: fullOrder.orderCode,
        customerName: fullOrder.customer ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}` : '',
        customerEmail: fullOrder.customer?.email || '',
        customerPhone: fullOrder.customer?.phone || fullOrder.customer?.phone || '---',
        customerAddress: fullOrder.customer ? `${fullOrder.customer.city || ''}` : '---',
        date: this.formatDateToMMDDYYYY(fullOrder.createdAt || new Date()),
        device: fullOrder.device?.name || '',
        model: fullOrder.model || '-',
        serial: fullOrder.serial || '-',
        defectivePart: fullOrder.defectivePart || '---',
        price: fullOrder.price || 0,
        repairCost: fullOrder.repairCost || 0,
        advancePayment: fullOrder.advancePayment || 0,
        tax: fullOrder.price * fullOrder.tax / 100 || 0,
        discount: fullOrder.price * fullOrder.costdiscount / 100 || 0,
        total: fullOrder.price - fullOrder.costdiscount + (fullOrder.price * fullOrder.tax / 100) || 0,
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

  async findAll(user?: any) {
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
      'receivedParts'
    ];

    // If caller provides an authenticated user who is an Expert and NOT a center admin,
    // return only service orders created by them or assigned to them.
    try {
      const empType = user?.employee_type ?? user?.type ?? user?.role;
      const empId = user?.employeeId ?? user?.sub ?? user?.id;
      const isCenterAdmin = !!user?.isCenterAdmin;

      if (empType === 'Expert' && !isCenterAdmin && empId) {
        return this.serviceOrderRepository.find({
          where: [
            { createdById: empId },
            { assignedTechId: empId }
          ],
          relations,
        });
      }
    } catch (err) {
      // fallback to full list if any error inspecting user
    }

    return this.serviceOrderRepository.find({ relations });
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
        'receivedParts'
      ],
    });
    if (!entity) throw new NotFoundException(`ServiceOrder #${id} not found`);
    return entity;
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
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.serviceOrderRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`ServiceOrder #${id} not found`);
    return { deleted: true };
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
        'receivedParts'
      ],
    });

    if (!fullOrder) throw new NotFoundException(`ServiceOrder #${id} not found`);

    const lastRepairStatus = (fullOrder.repairStatus && (Array.isArray(fullOrder.repairStatus)
      ? fullOrder.repairStatus[fullOrder.repairStatus.length - 1]
      : fullOrder.repairStatus)) || null;

    const pdfData = {
      orderCode: fullOrder.orderCode,
      customerName: fullOrder.customer ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}` : '',
      customerEmail: fullOrder.customer?.email || '',
      customerPhone: fullOrder.customer?.phone || fullOrder.customer?.phone || '',
      customerAddress: fullOrder.customer ? `${fullOrder.customer.city || ''}` : '',
      date: this.formatDateToMMDDYYYY(fullOrder.createdAt) || '',
      device: fullOrder.device?.name || '-',
      model: fullOrder.model || '-',
      serial: fullOrder.serial || '',
      defectivePart: fullOrder.defectivePart || '-',
      price: fullOrder.price || 0,
      repairCost: fullOrder.repairCost || 0,
      advancePayment: fullOrder.advancePayment || 0,
      tax: fullOrder.price * fullOrder.tax / 100 || 0,
      discount: fullOrder.price * fullOrder.costdiscount / 100 || 0,
      total: fullOrder.price - fullOrder.costdiscount + (fullOrder.price * fullOrder.tax / 100) || 0,
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
    };

    if (this.pdfJobService) {
      this.pdfJobService.enqueue({ pdfData });
      return { ok: true, queued: true };
    }

    // Fallback: generate PDF synchronously and send
    let pdfBuffer: Buffer;
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

    return { ok: true, queued: false };
  }
}
