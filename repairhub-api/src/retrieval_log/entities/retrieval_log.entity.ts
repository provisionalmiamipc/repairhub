import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';

@Entity('retrieval_log')
export class RetrievalLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ServiceOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_order_id' })
  serviceOrder: ServiceOrder;

  @Column('int', { name: 'service_order_id' })
  serviceOrderId: number;

  @Column('text')
  strategy: 'case' | 'manual' | 'web' | 'llm' | 'heuristic';

  @Column('numeric', { precision: 8, scale: 4 })
  score: number;

  @Column('jsonb', { nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
