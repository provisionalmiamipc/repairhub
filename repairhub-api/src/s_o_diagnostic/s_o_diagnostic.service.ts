import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SODiagnostic } from './entities/s_o_diagnostic.entity';
import { CreateSODiagnosticDto } from './dto/create-s_o_diagnostic.dto';
import { UpdateSODiagnosticDto } from './dto/update-s_o_diagnostic.dto';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { Employee } from '../employees/entities/employee.entity';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class SODiagnosticService {
  constructor(
    @InjectRepository(SODiagnostic)
    private readonly sODiagnosticRepository: Repository<SODiagnostic>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly emailService: EmailService,
  ) {}

  async create(createSODiagnosticDto: CreateSODiagnosticDto) {
    const sODiagnostic = this.sODiagnosticRepository.create({
      ...createSODiagnosticDto,
      /*center: { id: createSODiagnosticDto.centerId },
      store: { id: createSODiagnosticDto.storeId },
      serviceOrder: { id: createSODiagnosticDto.serviceOrderId },
      employee: { id: createSODiagnosticDto.createdById },*/
    });
    const saved = await this.sODiagnosticRepository.save(sODiagnostic);

    // After save, send notification depending on sendEmail flag
    try {
      const order = await this.serviceOrderRepository.findOne({ where: { id: saved.serviceOrderId }, relations: ['customer'] });
      const customer = order?.customer || null;
      const customerName = customer ? `${customer.firstName} ${customer.lastName}` : (order as any).customerName || '';
      const orderCode = (order as any).orderCode || String(saved.serviceOrderId);
      const date = saved.createdAt || new Date();

      if (saved.sendEmail) {
        const to = customer?.email || (order as any).customerEmail || null;
        if (to) {
          await this.emailService.sendDiagnosticNotification({ to, customerName, orderCode, diagnostic: saved.diagnostic, date, forCenter: false });
        } else {
          console.warn('SODiagnosticService: sendEmail requested but no customer email found', { serviceOrderId: saved.serviceOrderId });
        }
      } else {
        // notify center admins
        const centerId = saved.centerId;
        const admins = await this.employeeRepository.find({ where: { centerId, isCenterAdmin: true, isActive: true } });
        const emails = admins.map(a => a.email).filter(Boolean);
        if (emails.length > 0) {
          await this.emailService.sendDiagnosticNotification({ to: emails, customerName, orderCode, diagnostic: saved.diagnostic, date, forCenter: true });
        } else {
          console.warn('SODiagnosticService: no center admins found to notify', { centerId });
        }
      }
    } catch (err) {
      console.error('SODiagnosticService: failed to send diagnostic notification', err);
    }

    return saved;
  }

  async findAll() {
    return this.sODiagnosticRepository.find({ relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async findOne(id: number) {
    return this.sODiagnosticRepository.findOne({ where: { id }, relations: ['center', 'store', 'serviceOrder', 'employee'] });
  }

  async update(id: number, updateSODiagnosticDto: UpdateSODiagnosticDto) {
    const updateData: any = { ...updateSODiagnosticDto };
    if ((updateSODiagnosticDto as any).centerId) updateData.center = { id: (updateSODiagnosticDto as any).centerId };
    if ((updateSODiagnosticDto as any).storeId) updateData.store = { id: (updateSODiagnosticDto as any).storeId };
    if ((updateSODiagnosticDto as any).serviceOrderId) updateData.serviceOrder = { id: (updateSODiagnosticDto as any).serviceOrderId };
    if ((updateSODiagnosticDto as any).createdBy) updateData.createdBy = { id: (updateSODiagnosticDto as any).createdBy };
    await this.sODiagnosticRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.sODiagnosticRepository.delete(id);
    return { deleted: true };
  }
}
