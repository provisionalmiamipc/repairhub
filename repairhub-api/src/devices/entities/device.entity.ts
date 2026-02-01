import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exclude } from 'class-transformer';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Center, (center) => center.devices)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.device)
	@JoinColumn({ name: 'storeId' })
	store: Store;

  @Column('int')
  centerId: number;

  @Column('int')
  storeId: number;

  @Column()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp'})
  updatedAt: Date;
	  
  @OneToMany(() => Appointment, (appointment) => appointment.deviceType)
  appointments: Appointment[];

  serviceOrders: any;
}
