import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceOrder } from '../../service_orders/entities/service_order.entity';

@Entity('chat_message')
@Index('IDX_chat_message_serviceOrderId_created_at', ['serviceOrderId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ServiceOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceOrderId' })
  serviceOrder: ServiceOrder;

  @Column('int')
  serviceOrderId: number;

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
