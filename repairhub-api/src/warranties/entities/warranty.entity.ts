import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Device } from '../../devices/entities/device.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';

export type WarrantyDurationUnit = 'days' | 'months' | 'years';
export type WarrantyStatus = 'active' | 'expired' | 'void';

@Entity('service_order_warranties')
export class Warranty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  centerId: number;

  @ManyToOne(() => Center)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @Column('int')
  storeId: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column('int')
  serviceOrderId: number;

  @ManyToOne(() => ServiceOrder, (serviceOrder) => serviceOrder.warranties)
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder: ServiceOrder;

  @OneToMany(() => ServiceOrder, (serviceOrder) => serviceOrder.warranty)
  warrantyOrders: ServiceOrder[];

  @Column('int')
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column('int')
  deviceId: number;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ nullable: true })
  serial?: string;

  @Column({ type: 'varchar', default: 'active' })
  status: WarrantyStatus;

  @Column('int', { default: 6 })
  warrantyDuration: number;

  @Column({ type: 'varchar', default: 'months' })
  warrantyDurationUnit: WarrantyDurationUnit;

  @Column({ type: 'timestamp' })
  warrantyStartDate: Date;

  @Column({ type: 'timestamp' })
  warrantyEndDate: Date;

  @Column({ type: 'text', nullable: true })
  coverageSummary?: string;

  @Column({ type: 'text', nullable: true })
  warrantyVoidReason?: string;

  @Column({ type: 'text', nullable: true })
  warrantyVoidNotes?: string;

  @Column('int', { nullable: true })
  createdById?: number | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'createdById' })
  createdBy?: Employee | null;

  @Column('int', { nullable: true })
  voidedById?: number | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'voidedById' })
  voidedBy?: Employee | null;

  @Column({ type: 'timestamp', nullable: true })
  voidedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
