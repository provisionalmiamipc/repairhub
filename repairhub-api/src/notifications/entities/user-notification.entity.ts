import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notification } from './notification.entity';

@Entity('user_notifications')
export class UserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  notificationId: number;

  @ManyToOne(() => Notification, (n) => (n as any).userNotifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  @Column()
  employeeId: number;

  @Column({ type: 'enum', enum: ['unread', 'read'], default: 'unread' })
  status: 'unread' | 'read';

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
