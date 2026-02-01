import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exclude } from 'class-transformer';

@Entity('service_types')
export class ServiceType {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Center, (center) => center.serviceType)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.serviceType)
	@JoinColumn({ name: 'storeId' })
	store: Store;

	@Column('int')
	centerId: number;

	@Column('int')
	storeId: number;

	@Column({ unique: true })
	@IsString()
	@IsNotEmpty()
	name: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	description?: string;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;
	//appointments: any;

    @OneToMany(() => Appointment, (appointment) => appointment.serviceType)
	appointments: Appointment[];
}
