
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { IsString, IsOptional, IsUrl, IsDate, IsNotEmpty, IsEmail, Matches, MaxLength, IsInt } from 'class-validator';
import { Center } from '../../centers/entities/center.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Exclude } from 'class-transformer';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Notification } from '../../notifications/entities/notification.entity';


@Entity('stores')
export class Store {
    @PrimaryGeneratedColumn()
    id: number;

	@Column({ unique: true })
	@IsString()
	storeCode: string;

	@Column()
	@IsInt()
	@IsNotEmpty()
	centerId: number;

	@Column()
	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	storeName: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	logo?: string;

	@Column({nullable: true})
	@IsString()
	@IsOptional()
	country?: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	address?: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	zipCode?: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	city?: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	state?: string;

	@Column({nullable: true})
	@IsOptional()
	@IsString()
	time_zone?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsEmail()
	email?: string;

	@Column({ nullable: true })
	@IsOptional()
	@Matches(/^\+?[0-9\s\-]{7,20}$/, { message: 'El número de teléfono no es válido' })
	phoneNumber?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsUrl()
	webSite?: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	
	@ManyToOne(() => Center, (center) => center.stores)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@OneToMany(() => Appointment, (appoiment) => appoiment.store)
	appointments: Appointment[];

	@OneToMany(() => Employee, (employee) => employee.store)	
	employees: Employee[];

	customers: any;
	deviceBrands: any;
	device: any;
	inventoryMovements: any;
	items: any;
	itemType: any;
	orders: any;
	orderItems: any;
	repairStatus: any;
	sodiagnostic: any;
	soitems: any;
	sonotes: any;
	saleItems: any;
	sales: any;
	serviceOrders: any;
	soRequested: any;
	serviceType: any;
    @OneToMany(() => Notification, (notification) => notification.store)
    notifications: Notification[];
}
