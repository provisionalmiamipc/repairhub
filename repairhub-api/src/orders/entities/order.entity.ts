import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsString } from 'class-validator';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsInt, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Customer } from '../../customers/entities/customer.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { OrdersItem } from '../../orders_item/entities/orders_item.entity';
import { PaymentType } from '../../payment_type/entities/payment_type.entity';
import { Exclude } from 'class-transformer';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

    @Column({ unique: true })
    @IsString()
    orderCode: string;

  @ManyToOne(() => Center, (center) => center.orders)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column('int')
  centerId: number;

  @Column('int')
  storeId: number;


  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column('int', { nullable: true })
  @IsOptional()
  customerId?: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  totalPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  totalCost: number;


  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  tax: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  advancePayment: number;


  @ManyToOne(() => PaymentType, paymentType => paymentType.orders)
  @JoinColumn({ name: 'paymentTypeId' })
  paymentType?: PaymentType;

  @Column('int', { nullable: true })
  @IsOptional()
  paymentTypeId?: number;

  @Column({ nullable: true })
  @IsOptional()
  note?: string;

  @Column({ default: false })
  @IsBoolean()
  cloused: boolean;

  @Column({ default: false })
  @IsBoolean()
  canceled: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  
  @ManyToOne(() => Employee, employee => employee.corders)
  @JoinColumn({ name: 'createdById' })
  employee: Employee;

  @Column('int')
  createdById: number;

  /*
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'updatedById' })
  updatedBy: Employee;*/

  
  @OneToMany(() => OrdersItem, (ordersItem) => ordersItem.order)
  items: OrdersItem[];
  
  soRequested: any;
}
