import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsNotEmpty } from 'class-validator';
import { Exclude } from 'class-transformer';

@Entity('payment_types')
export class PaymentType {
  @PrimaryGeneratedColumn()
  id: number;

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
  @IsNotEmpty()
  type: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  orders: any;
  sales: any;
  serviceOrders: any;
}
