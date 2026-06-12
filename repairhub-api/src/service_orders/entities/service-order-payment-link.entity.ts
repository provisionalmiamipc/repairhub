import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceOrder } from './service_order.entity';

export type PaymentLinkConcept =
  | 'total'
  | 'advance_payment'
  | 'pending_payment'
  | 'pickup'
  | 'delivery'
  | 'custom';

export type PaymentLinkStatus = 'pending' | 'paid' | 'failed' | 'deleted';

@Entity('service_order_payment_links')
export class ServiceOrderPaymentLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  serviceOrderId: number;

  @ManyToOne(() => ServiceOrder, (serviceOrder) => serviceOrder.paymentLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder: ServiceOrder;

  @Column({ type: 'varchar' })
  concept: PaymentLinkConcept;

  @Column({ type: 'varchar' })
  title: string;

  @Column('bigint')
  amount: string;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: PaymentLinkStatus;

  @Column({ type: 'varchar', nullable: true })
  squarePaymentLinkId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  squareOrderId?: string | null;

  @Column({ type: 'text', nullable: true })
  url?: string | null;

  @Column({ type: 'varchar', unique: true })
  idempotencyKey: string;

  @Column('int', { nullable: true })
  createdById?: number | null;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
