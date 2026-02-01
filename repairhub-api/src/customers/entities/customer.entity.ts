import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsInt, Min, Max, Matches, IsNotEmpty } from 'class-validator';
import { Exclude } from 'class-transformer';
import { Appointment } from '../../appointments/entities/appointment.entity';

import { Gender } from '../../common/enums/gender.enum';


@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn()
    id: number;

	@Column({ unique: true })
	@IsString()
	customerCode: string;


	@ManyToOne(() => Center, (center) => center.customers)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.customers)
	@JoinColumn({ name: 'storeId' })
	store: Store;

	@Column('int')
	centerId: number;

	@Column('int')
	storeId: number;

	@Column()
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@Column()
	@IsString()
	@IsNotEmpty()
	lastName: string;

	@Column({ nullable: true })
	@IsOptional()
	@Matches(/^\+?[0-9\s\-]{7,20}$/, { message: 'El número de teléfono no es válido' })
	phone?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsEmail()
	email?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	city?: string;

	@Column({
		type: 'enum',
		enum: Gender
	})
	@IsEnum(Gender)
	gender: Gender;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	extraInfo?: string;

	@Column({ default: false })
	@IsBoolean()
	b2b: boolean;

	@Column({ type: 'int', default: 0 })
	@IsInt()
	@Min(0)
	@Max(100)
	discount: number;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	
	orders: any;
	sales: any;
	serviceOrders: any;
}
