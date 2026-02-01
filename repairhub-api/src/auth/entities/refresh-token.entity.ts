import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  ownerType: 'user' | 'employee';

  @Column('int')
  ownerId: number;

  @Column({ type: 'varchar', length: 192 })
  tokenHash: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: 'int', nullable: true })
  replacedById?: number | null;
}
