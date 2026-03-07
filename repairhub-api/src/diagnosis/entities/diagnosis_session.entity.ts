import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';

@Entity('diagnosis_session')
@Index('IDX_diagnosis_session_service_order_id', ['serviceOrderId'])
export class DiagnosisSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServiceOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrder;

  @Column('int', { name: 'service_order_id' })
  serviceOrderId: number;

  @Column('jsonb')
  state: {
    category: string;
    currentStep: string;
    answers: Record<string, string>;
    lastQuestion: string;
    path: string[];
    defect?: string;
    device?: string;
    brand?: string;
    model?: string;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
