
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Unique, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsInt, Min, Max, Length, Matches, MaxLength } from 'class-validator';
import { Store } from '../../stores/entities/store.entity';

import { Center } from '../../centers/entities/center.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrdersItem } from '../../orders_item/entities/orders_item.entity';
import { Exclude } from 'class-transformer';

import { Gender } from '../../common/enums/gender.enum';
import * as bcrypt from 'bcrypt';


@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn()
    id: number;

	@Column({ unique: true })
	@IsString()
	employeeCode: string;

	@Column()
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@Column()
	@IsString()
	@IsNotEmpty()
	lastName: string;

	@Column({
		type: 'enum',
		enum: Gender
	})
	@IsEnum(Gender)
	gender: Gender;

	@Column({ unique: true })
	@IsString()
	@IsNotEmpty()
	@Matches(/^\+?[0-9\s\-]{7,20}$/, { message: 'El número de teléfono no es válido' })
	phone: string;

	@Column({ unique: true })
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Column({
		type: 'enum',
		enum: ['Expert', 'Accountant', 'AdminStore'],
		default: 'Expert'
	})
	@IsEnum(['Expert', 'Accountant', 'AdminStore'])
	employee_type: 'Expert' | 'Accountant' | 'AdminStore';

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	jobTitle?: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	avatar?: string;

	@Column({ type: 'int', default: 5 })
	@IsInt()
	@Min(0)
	pinTimeout: number;

	@Column()
	@IsString()
	@MaxLength(4)
	pin: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()	
	password: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	@ManyToOne(() => Center, (center) => center.employees)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.employees)
	@JoinColumn({ name: 'storeId' })
	store: Store;

	@Column('int')
	centerId: number;

	@Column('int', {nullable: true})
	@IsOptional()
	storeId?: number;

	@Column({ default: false })
	isCenterAdmin: boolean;

	@Column({ default: true })
    isActive: boolean;


	/*@OneToMany(() => Order, (order) => order.createdBy)
	createdOrders: Order[];

	@OneToMany(() => Order, (order) => order.updatedBy)
	updatedOrders: Order[];

	@OneToMany(() => OrdersItem, (ordersItem) => ordersItem.createdBy)
	createdOrdersItems: OrdersItem[];

	@OneToMany(() => OrdersItem, (ordersItem) => ordersItem.updatedBy)
	updatedOrdersItems: OrdersItem[];*/

	@OneToMany(() => Appointment, (appointment) => appointment.employee)
	appointments: Appointment[];
	inventoryMovements: any;
	corders: any;
	ordersItems: any;
	repairStatus: any;
	sodiagnostic: any;
	soitems: any;
	sonotes: any;
	sales: any;
	assignedTech: any;
	cserviceOrders: any;
    @OneToMany(() => Notification, (notification) => notification.employee)
    notifications: Notification[];


  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Solo hashear si la contraseña cambió y no está ya hasheada
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

}
