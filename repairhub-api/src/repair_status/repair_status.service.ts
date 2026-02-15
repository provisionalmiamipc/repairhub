import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepairStatus } from './entities/repair_status.entity';
import { CreateRepairStatusDto } from './dto/create-repair_status.dto';
import { UpdateRepairStatusDto } from './dto/update-repair_status.dto';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class RepairStatusService {
  constructor(
    @InjectRepository(RepairStatus)
    private readonly repairStatusRepository: Repository<RepairStatus>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    private readonly emailService: EmailService,
  ) {}

  async create(createRepairStatusDto: CreateRepairStatusDto) {
    const repairStatus = this.repairStatusRepository.create({
      ...createRepairStatusDto,
    });

    // Count existing statuses for the order to decide whether to send email
    const serviceOrderId = createRepairStatusDto.serviceOrderId;
    const existingCount = await this.repairStatusRepository.count({ where: { serviceOrderId } });

    const saved = await this.repairStatusRepository.save(repairStatus);

    // If this is not the first status (existingCount > 0) then notify customer
    if (existingCount > 0) {
      try {
        const order = await this.serviceOrderRepository.findOne({ where: { id: serviceOrderId }, relations: ['customer'] });
        const customer = (order && (order as any).customer) || null;
        const to = customer?.email || (order as any).customerEmail || null;
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : (order as any).customerName || '';
        if (to) {
          await this.emailService.sendRepairStatusUpdate({
            to,
            customerName,
            orderCode: (order as any).orderCode || String(serviceOrderId),
            status: saved.status,
            date: saved.createdAt || new Date(),
          });
        }
      } catch (err) {
        // don't block creation on email errors
        console.error('RepairStatusService: failed to send status update email', err);
      }
    }

    return saved;
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
