import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Order } from '../../orders/entities/order.entity';
import { Item } from '../../item/entities/item.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Exclude } from 'class-transformer';


@Entity('orders_item')
export class OrdersItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Center, (center) => center.orderItems)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.orderItems)
	@JoinColumn({ name: 'storeId' })
	store: Store;

  @Column('int')
  centerId: number;

  @Column('int')
  storeId: number;

  
  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('int')
  orderId: number;

  
  @ManyToOne(() => Item, item => item.orderItems)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column('int')
  itemId: number;

  @Column({type: 'int', default: 1})
  @IsInt()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  cost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  price: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  discount: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @Column()
  @IsString()
  link: string;

  @Column()
  @IsString()
  @IsOptional()
  condition?: string;

  @Column({ default: false })
  @IsBoolean()
  received: boolean;

  @Column({ nullable: true })
  @IsOptional()
  note?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Employee, employee => employee.ordersItems)
  @JoinColumn({ name: 'createdById' })
  createdBy: Employee;

  @Column('int')
  createdById: number;

 /* @ManyToOne(() => Employee)
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: Employee;*/
  
}
