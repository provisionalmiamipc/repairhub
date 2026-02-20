
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { ScheduledNotification } from './entities/scheduled-notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(ScheduledNotification)
    private readonly scheduledNotificationRepository: Repository<ScheduledNotification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async createAndEmit(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const saved = await this.create(createNotificationDto);
    if (saved.isBroadcast) {
      this.gateway.emitBroadcast('notification', saved);
    } else if (saved.employeeId) {
      this.gateway.emitToEmployee(saved.employeeId, 'notification', saved);
    }
    return saved;
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find();
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    return notification;
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async findForEmployee(employeeId: number, opts?: { limit?: number; offset?: number; onlyUnread?: boolean }) {
    const limit = opts?.limit ?? 20;
    const offset = opts?.offset ?? 0;

    // If employeeId is not valid, throw so controller can decide (400)
    if (!employeeId || Number.isNaN(Number(employeeId))) {
      throw new BadRequestException('Invalid employee id');
    }

    // Base query: join optional per-user read state
    const qb = this.notificationRepository.createQueryBuilder('n')
      .leftJoinAndMapOne(
        'n.userNotification',
        UserNotification,
        'un',
        'un.notificationId = n.id AND un.employeeId = :empId',
        { empId: employeeId },
      )
      .where('n.employeeId = :id OR n.isBroadcast = true', { id: employeeId });

    // total count for pagination
    const total = await qb.getCount();

    // select needed columns including per-user read state (un)
    const rawRows = await qb
      .select([
        'n.id as n_id',
        'n.title as n_title',
        'n.message as n_message',
        'n.type as n_type',
        'n.priority as n_priority',
        'n.status as n_status',
        'n.isBroadcast as n_isBroadcast',
        'n.actionUrl as n_actionUrl',
        'n.createdAt as n_createdAt',
        'un.status as un_status',
        'un.readAt as un_readAt',
        'n.employeeId as n_employeeId'
      ])
      .orderBy('n.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getRawMany();

    // Map raw rows into normalized items merging per-user state when available
    const mapped = rawRows.map((r: any) => {
      const item: any = {
        id: Number(r.n_id),
        title: r.n_title,
        message: r.n_message,
        type: r.n_type,
        priority: r.n_priority,
        status: r.un_status ?? r.n_status,
        isBroadcast: Boolean(r.n_isBroadcast),
        actionUrl: r.n_actionUrl,
        createdAt: r.n_createdAt,
        readAt: r.un_readAt ?? null,
        employeeId: r.n_employeeId ?? null,
      };
      return item;
    });

    // Server-side deduplication: prefer employee-specific notifications over broadcasts
    // Key by title+message+actionUrl to collapse duplicates that represent the same logical notification
    const result: any[] = [];
    const seenIndex = new Map<string, number>();
    const makeKey = (x: any) => `${(x.title ?? '').toString().trim().toLowerCase()}::${(x.message ?? '').toString().trim().toLowerCase()}::${(x.actionUrl ?? '').toString().trim().toLowerCase()}`;

    for (const n of mapped) {
      const key = makeKey(n);
      if (seenIndex.has(key)) {
        const idx = seenIndex.get(key)!;
        const existing = result[idx];
        // Prefer personal (employee-owned) notifications over broadcasts
        const existingPersonal = !!existing.employeeId && existing.employeeId === employeeId;
        const newPersonal = !!n.employeeId && n.employeeId === employeeId;
        if (!existingPersonal && newPersonal) {
          result[idx] = n;
        } else if (existingPersonal === newPersonal) {
          // If both same personal flag, prefer the newest
          const existingTime = new Date(existing.createdAt).getTime();
          const newTime = new Date(n.createdAt).getTime();
          if (newTime > existingTime) result[idx] = n;
        }
      } else {
        seenIndex.set(key, result.length);
        result.push(n);
      }
    }

    // Recompute total and unreadCount from deduplicated result
    const dedupedTotal = result.length;
    const unreadCount = result.filter((r: any) => r.status === NotificationStatus.UNREAD).length;

    return { items: result, total: dedupedTotal, unreadCount };
  }

  async markRead(id: number, actor?: { employeeId?: number; role?: string }) {
    const notification = await this.findOne(id);
    const actorId = actor?.employeeId;
    const role = actor?.role;

    // If this is a broadcast, create/update a per-user read entry
    if (notification.isBroadcast) {
      if (!actorId) throw new ForbiddenException('Employee id required to mark broadcast as read');
      let un: UserNotification | null = await this.userNotificationRepository.findOne({ where: { notificationId: id, employeeId: actorId } });
      if (!un) {
        un = this.userNotificationRepository.create({ notificationId: id, employeeId: actorId, status: NotificationStatus.READ, readAt: new Date() });
      } else {
        un.status = NotificationStatus.READ;
        un.readAt = new Date();
      }
      await this.userNotificationRepository.save(un);

      // Return merged view
      const merged: any = { ...notification, status: NotificationStatus.READ, readAt: un.readAt };
      return merged;
    }

    // Non-broadcast: only owner or admin can mark
    const ownerId = notification.employeeId;
    if (ownerId && ownerId !== actorId && role !== 'admin') {
      throw new ForbiddenException('Not allowed to mark this notification as read');
    }

    await this.notificationRepository.update(id, { status: NotificationStatus.READ, readAt: new Date() });
    return this.notificationRepository.findOneBy({ id });
  }
}
