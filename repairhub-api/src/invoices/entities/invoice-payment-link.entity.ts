import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export type InvoicePaymentLinkStatus = 'pending' | 'paid' | 'failed' | 'deleted';

@Entity('invoice_payment_links')
export class InvoicePaymentLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  invoiceId: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.paymentLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'varchar' })
  title: string;

  @Column('bigint')
  amount: string;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: InvoicePaymentLinkStatus;

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
