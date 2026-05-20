import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type MediaAssetStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'deleted';

@Entity('media_assets')
@Index(['ownerType', 'ownerId'])
export class MediaAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ownerType: string;

  @Column('int')
  ownerId: number;

  @Column({ default: 'image' })
  kind: string;

  @Column({ default: 'pending' })
  status: MediaAssetStatus;

  @Column()
  bucket: string;

  @Column({ nullable: true })
  displayKey?: string;

  @Column({ nullable: true })
  thumbnailKey?: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column('int', { nullable: true })
  displaySize?: number;

  @Column('int', { nullable: true })
  thumbnailSize?: number;

  @Column('int', { nullable: true })
  width?: number;

  @Column('int', { nullable: true })
  height?: number;

  @Column('int', { default: 0 })
  sortOrder: number;

  @Column('text', { nullable: true })
  error?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
