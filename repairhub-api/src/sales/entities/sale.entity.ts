import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { IsString } from 'class-validator';

import { PaymentType } from '../../payment_type/entities/payment_type.entity';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Exclude } from 'class-transformer';

@Entity('sales')
export class Sale {
  
  @PrimaryGeneratedColumn()
  id: number;

    @Column({ unique: true })
    @IsString()
    saleCode: string;

  @ManyToOne(() => Center, (center) => center.sales)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.sales)
	@JoinColumn({ name: 'storeId' })
	store: Store;

  @Column('int')
  centerId: number;

  @Column('int')
  storeId: number;

  
  @ManyToOne(() => Employee, employee => employee.sales)
  @JoinColumn({ name: 'createdById' })
  employee: Employee;

  @Column('int')
  createdById: number;

  /*@ManyToOne(() => Employee)
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: Employee;*/

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  
  @ManyToOne(() => Customer, customer => customer.sales, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Column('int')
  customerId?: number;

  
  @ManyToOne(() => PaymentType, paymentType => paymentType.sales)
  @JoinColumn({ name: 'paymentTypeId' })
  paymentType: PaymentType;

  @Column('int')
  paymentTypeId: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalDiscount: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  
  @Column({ default: false })
  cloused: boolean;
  
  @Column({ default: false })
  canceled: boolean;
  
  saleItems: any;

}
