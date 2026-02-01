import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, UpdateDateColumn, Unique } from 'typeorm';
import { IsString, IsOptional, IsUrl, IsDate, IsNotEmpty, IsEmail, Matches, isPhoneNumber, MaxLength } from 'class-validator';
import { Store } from '../../stores/entities/store.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Exclude } from 'class-transformer';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Notification } from '../../notifications/entities/notification.entity';


@Entity('centers')
export class Center {
    @PrimaryGeneratedColumn()
    id: number;

	@Column({ unique: true })
	@IsString()
	centerCode: string;

	@Column({unique: true})
	@IsString()
	@IsNotEmpty()	
	centerName: string;

	@Column({nullable: true})
	@IsString()
	logo: string;

	@Column({ nullable: true })
	@IsString()
	@IsOptional()
	country?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	address?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	zipCode?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	state?: string;

	@Column({ nullable: true })
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
	createdAt?: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt?: Date;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	completion: string;

	@OneToMany(() => Appointment, (appointment) => appointment.center)
	appointments: Appointment[];

	customers: any;

	// Relaciones

	@OneToMany(() => Store, (store) => store.center)
	stores: Store[];


	@OneToMany(() => Employee, (employee) => employee.center)
	employees: Employee[];

	deviceBrands: any;
	devices: any;
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
	appoinments: any;
    @OneToMany(() => Notification, (notification) => notification.center)
    notifications: Notification[];
  
}
