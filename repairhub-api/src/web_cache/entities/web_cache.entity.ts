import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('web_cache')
@Index('UQ_web_cache_query_hash', ['queryHash'], { unique: true })
@Index('IDX_web_cache_created_at', ['createdAt'])
export class WebCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'query_hash' })
  queryHash: string;

  @Column('text')
  brand: string;

  @Column('text')
  model: string;

  @Column('text')
  defect: string;

  @Column('jsonb')
  results: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
