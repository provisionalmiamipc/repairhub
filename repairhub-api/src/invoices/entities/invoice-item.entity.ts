import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Item } from '../../item/entities/item.entity';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';
import { Invoice } from './invoice.entity';

export type InvoiceItemType = 'service' | 'part' | 'labor' | 'custom';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @ManyToOne(() => Item, { nullable: true })
  @JoinColumn({ name: 'itemId' })
  item?: Item | null;

  @ManyToOne(() => ServiceOrder, { nullable: true })
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder?: ServiceOrder | null;

  @Column('int')
  invoiceId: number;

  @Column({ type: 'varchar' })
  itemType: InvoiceItemType;

  @Column('int', { nullable: true })
  itemId?: number | null;

  @Column('int', { nullable: true })
  serviceOrderId?: number | null;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 12, scale: 2, default: 1 })
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  unitPrice: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  lineTotal: number;

  @Column('int', { default: 0 })
  sortOrder: number;
}
