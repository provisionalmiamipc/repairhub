import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';

@Entity('document')
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ServiceOrder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder?: ServiceOrder | null;

  @Column('int', { nullable: true })
  serviceOrderId?: number | null;

  @Column('text')
  filename: string;

  @Column('text', { name: 'storage_path' })
  storagePath: string;

  @Column('text', { name: 'mime_type' })
  mimeType: string;

  @Column('bigint', { name: 'size_bytes' })
  sizeBytes: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
