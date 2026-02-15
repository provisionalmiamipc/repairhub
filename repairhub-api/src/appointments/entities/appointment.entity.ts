import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsInt, IsDateString, IsString, IsOptional, IsDate, IsBoolean } from 'class-validator';
import { Customer } from '../../customers/entities/customer.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { ServiceType } from '../../service_type/entities/service_type.entity';
import { Device } from '../../devices/entities/device.entity';
import { Exclude } from 'class-transformer';


@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

	@Column({ unique: true })
	@IsString()
	appointmentCode: string;
	
    @ManyToOne(() => Center, (center) => center.appointments)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@Column('int')
	centerId: number;

	@Column('int')
	storeId: number;
	
	@ManyToOne(() => Store, (store) => store.appointments)
	@JoinColumn({ name: 'storeId' })
	store: Store;
	
	@Column()
	@IsString()
	customer: string; 

	@ManyToOne(() => Customer, customer => customer.serviceOrders)
    @JoinColumn({ name: 'ecustomerId' })
    ecustomer: Customer;

    @Column('int', { nullable: true })
    ecustomerId: number;

	@Column()
	@IsString()
	date: string

	@Column({ nullable: true})
	@IsString()
	time: string;
	
	@ManyToOne(() => Device, (device) => device.appointments)
	@JoinColumn({ name: 'deviceId' })
	deviceType: Device;

	@Column('int')
	deviceId: number;
	
	@ManyToOne(() => ServiceType, (servicetype) => servicetype.appointments)
	@JoinColumn({ name: 'serviceTypeId' })
	serviceType: ServiceType;

	@Column('int')
	serviceTypeId: number;

	@Column('int')
	@IsInt()
	@IsOptional()
	duration?: number;

	@Column({nullable: true })
	@IsOptional()
	notes?: string;

	@Column({ default: false })
	@IsBoolean()
	cloused: boolean;
	
	@Column({ default: false })
	@IsBoolean()
	canceled: boolean;
	
    @ManyToOne(() => Employee, (employee) => employee.appointments)
	@JoinColumn({ name: 'createdById' })
	employee: Employee;

	@Column('int', { nullable: true })
	@IsOptional()
	createdById: number | null;

	@ManyToOne(() => Employee, (employee) => employee.appointments)
	@JoinColumn({ name: 'assignedTechId' })
	assignedTech: Employee;

	@Column('int', { nullable: true })
	@IsOptional()
	assignedTechId: number | null;

    @CreateDateColumn({ type: 'timestamp' })
	@IsDate()
    createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	@IsDate()
    updatedAt: Date;

}
