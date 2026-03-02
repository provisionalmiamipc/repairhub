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
      .where('LOWER(s.status) = :st', { st: ScheduledNotificationStatus.PENDING })
      .andWhere('s.runAt <= :now', { now: new Date() })
      .orderBy('s.runAt', 'ASC')
      .limit(limit)
      .getMany();
  }

  async deletePendingForAppointment(appointmentId: number, kinds?: string[]) {
    const pending = await this.scheduledRepo.createQueryBuilder('s')
      .where('s.appointmentId = :appointmentId', { appointmentId })
      .andWhere('LOWER(s.status) = :st', { st: ScheduledNotificationStatus.PENDING })
      .getMany();
    if (!pending.length) return;

    if (!kinds || kinds.length === 0) {
      await this.scheduledRepo.createQueryBuilder()
        .delete()
        .from(ScheduledNotification)
        .where('"appointmentId" = :appointmentId', { appointmentId })
        .andWhere('LOWER(status) = :st', { st: ScheduledNotificationStatus.PENDING })
        .execute();
      return;
    }

    const targetKinds = new Set(kinds);
    const idsToDelete = pending
      .filter((row) => {
        try {
          const payload = row.payload ? JSON.parse(row.payload) : {};
          return targetKinds.has(payload?.kind);
        } catch (_e) {
          return true;
        }
      })
      .map((row) => row.id);

    if (idsToDelete.length > 0) {
      await this.scheduledRepo.delete(idsToDelete);
    }
  }

  async markSent(id: number) {
    await this.scheduledRepo.update(id, { status: ScheduledNotificationStatus.SENT });
  }

  async markFailed(id: number) {
    await this.scheduledRepo.update(id, { status: ScheduledNotificationStatus.FAILED });
  }
}
