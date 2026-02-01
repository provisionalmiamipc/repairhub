import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { Employee } from '../../employees/entities/employee.entity';

export enum NotificationType {
  SYSTEM = 'system',
  ALERT = 'alert',
  REMINDER = 'reminder',
  ANNOUNCEMENT = 'announcement',
  TASK = 'task',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column('text')
  @IsNotEmpty()
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  // RELACIÓN CON CENTER (Muchos a Uno)
  @Column({ nullable: true })
  @IsOptional()
  centerId: number;

  @ManyToOne(() => Center, (center) => center.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'centerId' })
  center: Center;

  // RELACIÓN CON STORE (Muchos a Uno)
  @Column({ nullable: true })
  @IsOptional()
  storeId: number;

  @ManyToOne(() => Store, (store) => store.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  //RELACIÓN CON EMPLOYEE (Muchos a Uno)
  @Column({ nullable: true })
  @IsOptional()
  employeeId: number;

  @ManyToOne(() => Employee, (employee) => employee.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  // Metadata adicional
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: false })
  isBroadcast: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}
