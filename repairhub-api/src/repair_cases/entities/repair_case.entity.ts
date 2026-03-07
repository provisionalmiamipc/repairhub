import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('repair_case')
export class RepairCase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  brand: string;

  @Column('text')
  model: string;

  @Column('text')
  defect: string;

  @Column('text')
  symptoms: string;

  @Column('text', { name: 'root_cause', nullable: true })
  rootCause?: string | null;

  @Column('jsonb', { name: 'resolution_steps', nullable: true })
  resolutionSteps?: any[] | null;

  @Column('text', { default: 'internal' })
  source: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
