import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { PaymentType } from '../../payment_type/entities/payment_type.entity';
import { InvoiceItem } from './invoice-item.entity';
import { InvoicePaymentLink } from './invoice-payment-link.entity';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Center)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => ServiceOrder, { nullable: true })
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder?: ServiceOrder | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: Employee | null;

  @ManyToOne(() => PaymentType, { nullable: true })
  @JoinColumn({ name: 'paymentTypeId' })
  paymentType?: PaymentType | null;

  @Column('int')
  centerId: number;

  @Column('int')
  storeId: number;

  @Column('int')
  customerId: number;

  @Column('int', { nullable: true })
  serviceOrderId?: number | null;

  @Column('int', { nullable: true })
  createdById?: number | null;

  @Column('int', { nullable: true })
  paymentTypeId?: number | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: string | null;

  @Column({ type: 'varchar', nullable: true })
  via?: string | null;

  @Column({ type: 'varchar', nullable: true })
  billToName?: string | null;

  @Column({ type: 'text', nullable: true })
  billToAddress?: string | null;

  @Column({ type: 'varchar', nullable: true })
  billToContact?: string | null;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'text', nullable: true })
  serviceSummary?: string | null;

  @Column({ type: 'text', nullable: true })
  terms?: string | null;

  @Column({ type: 'text', nullable: true })
  paymentInstructions?: string | null;

  @OneToMany(() => InvoiceItem, (item) => item.invoice)
  items: InvoiceItem[];

  @OneToMany(() => InvoicePaymentLink, (paymentLink) => paymentLink.invoice)
  paymentLinks: InvoicePaymentLink[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
