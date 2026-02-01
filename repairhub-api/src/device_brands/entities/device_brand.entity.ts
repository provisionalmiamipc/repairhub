import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Exclude } from 'class-transformer';

@Entity('device_brands')
export class DeviceBrand {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Center, (center) => center.deviceBrands)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @ManyToOne(() => Store, (store) => store.deviceBrands)
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
  img?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp'})
  updatedAt: Date;
  
  serviceOrders: any;
}
