import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ServiceOrderPdfService } from './pdf.service';
import { ServiceOrderPuppeteerPdfService } from './puppeteer-pdf.service';
import { ServiceOrderSampleOverlayPdfService } from './sample-overlay-pdf.service';
import { ServiceOrderMailService } from './mail.service';
import { ServiceOrderPdfJobService } from './pdf-job.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrder } from './entities/service_order.entity';
import { CreateServiceOrderDto } from './dto/create-service_order.dto';
import { UpdateServiceOrderDto } from './dto/update-service_order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    private readonly pdfService: ServiceOrderPdfService,
    private readonly mailService: ServiceOrderMailService,
    @Optional() private readonly puppeteerPdfService?: ServiceOrderPuppeteerPdfService,
    @Optional() private readonly sampleOverlayPdfService?: ServiceOrderSampleOverlayPdfService,
    private readonly pdfJobService?: ServiceOrderPdfJobService,
  ) {}

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

    const entity = this.serviceOrderRepository.create({ ...createDto, orderCode });
    const savedOrder = await this.serviceOrderRepository.save(entity);

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
      ],
    });

    // Preparar datos para PDF y correo
    if (!fullOrder) {
      throw new NotFoundException('La orden de servicio no se encontró después de guardar.');
    }
      const pdfData = {
        orderCode: fullOrder.orderCode,
        customerName: fullOrder.customer ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}` : '',
        customerEmail: fullOrder.customer?.email || '',
        customerPhone: fullOrder.customer?.phone || fullOrder.customer?.phone || '',
        customerAddress: fullOrder.customer ? `${fullOrder.customer.city || ''}` : '',
        date: fullOrder.createdAt || new Date(),
        device: fullOrder.device?.name || '',
        model: fullOrder.model || '',
        serial: fullOrder.serial || '',
        defectivePart: fullOrder.defectivePart || '',
        price: fullOrder.price || 0,
        repairCost: fullOrder.repairCost || 0,
        advancePayment: fullOrder.advancePayment || 0,
        tax: fullOrder.price * fullOrder.tax / 100 || 0,
        discount: fullOrder.costdiscount || 0,
        total: fullOrder.price - fullOrder.costdiscount + (fullOrder.price * fullOrder.tax / 100) || 0,
        paymentType: fullOrder.paymentType?.type || '',
        assignedTech: fullOrder.assignedTech ? `${fullOrder.assignedTech.firstName} ${fullOrder.assignedTech.lastName}` : '',
        createdBy: fullOrder.employee ? `${fullOrder.employee.firstName} ${fullOrder.employee.lastName}` : '',
        estimated: fullOrder.estimated || '',
        noteReception: fullOrder.noteReception || '',
        terms: '',
        items: (fullOrder.soitems || []).map(it => ({
          description: it.item?.product || it.note || '',
          quantity: it.quantity || 1,
          price: it.price || it.cost || 0,
          discount: it.discount || 0,
        })),
      };
      // Enqueue PDF generation + email send to background job for faster response
      if (this.pdfJobService) {
        this.pdfJobService.enqueue({ pdfData });
      } else {
        // Fallback: do it synchronously if job service is missing
        let pdfBuffer: Buffer;
        if (this.puppeteerPdfService) {
          pdfBuffer = await this.puppeteerPdfService.generate(pdfData);
        } else if (this.sampleOverlayPdfService) {
          pdfBuffer = await this.sampleOverlayPdfService.generate(pdfData);
        } else {
          pdfBuffer = await this.pdfService.generate(pdfData);
        }
        if (pdfData.customerEmail) {
          await this.mailService.sendOrderCreatedMail(pdfData, pdfBuffer);
        }
      }

    return fullOrder;
  }

  async findAll() {
    return this.serviceOrderRepository.find({
      relations: [
        'center',
        'store',
        'customer',
        'device',
        'deviceBrand',
        'assignedTech',
        'employee',
        
      ],
    });
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
}
