import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ScheduledNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('scheduled_notifications')
export class ScheduledNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  appointmentId: number;

  @Column({ type: 'timestamp' })
  runAt: Date;

  @Column({ nullable: true })
  employeeId: number;

  @Column({ nullable: true })
  centerId: number;

  @Column({ nullable: true })
  storeId: number;

  @Column({ type: 'enum', enum: ScheduledNotificationStatus, default: ScheduledNotificationStatus.PENDING })
  status: ScheduledNotificationStatus;

  @Column('text', { nullable: true })
  payload: string; // JSON string for flexibility

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
