import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('received_parts')
export class ReceivedPart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  centerId: number;

  @ManyToOne(() => Center)
  @JoinColumn({ name: 'centerId' })
  center: Center;

  @Column('int')
  storeId: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column('int')
  serviceOrderId: number;

  @ManyToOne(() => ServiceOrder)
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder: ServiceOrder;

  @Column({ type: 'text' })
  accessory: string;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column('int', { nullable: true })
  createdById?: number | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'createdById' })
  createdBy?: Employee | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
