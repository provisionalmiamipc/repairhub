import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledNotification, ScheduledNotificationStatus } from './entities/scheduled-notification.entity';

@Injectable()
export class ScheduledNotificationsService {
  private readonly logger = new Logger(ScheduledNotificationsService.name);

  constructor(
    @InjectRepository(ScheduledNotification)
    private readonly scheduledRepo: Repository<ScheduledNotification>,
  ) {}

  async scheduleForAppointment(appointmentId: number, runAt: Date, payload: any, employeeId?: number, centerId?: number, storeId?: number) {
    const record = this.scheduledRepo.create({ appointmentId, runAt, employeeId, centerId, storeId, payload: JSON.stringify(payload) } as any);
    return this.scheduledRepo.save(record);
  }

  async findDue(limit = 50) {
    return this.scheduledRepo.createQueryBuilder('s')
      .where('s.status = :st', { st: ScheduledNotificationStatus.PENDING })
      .andWhere('s.runAt <= :now', { now: new Date() })
      .orderBy('s.runAt', 'ASC')
      .limit(limit)
      .getMany();
  }

  async markSent(id: number) {
    await this.scheduledRepo.update(id, { status: ScheduledNotificationStatus.SENT });
  }

  async markFailed(id: number) {
    await this.scheduledRepo.update(id, { status: ScheduledNotificationStatus.FAILED });
  }
}
