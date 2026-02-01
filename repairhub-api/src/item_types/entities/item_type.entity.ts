import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Item } from '../../item/entities/item.entity';
import { Exclude } from 'class-transformer';


@Entity('item_types')
@Unique(['name'])
export class ItemType {
    @PrimaryGeneratedColumn()
    id: number;


	@ManyToOne(() => Center, (center) => center.itemType)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.itemType)
	@JoinColumn({ name: 'storeId' })
	store: Store;

	@Column('int')
	centerId: number;

	@Column('int')
	storeId: number;

	@Column({ unique: true })
	@IsString()
	@IsNotEmpty()
	name: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	description?: string;

	@Column({ default: true })
	@IsBoolean()
	isActive: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp'})
	updatedAt: Date;

	
	@OneToMany(() => Item, (item) => item.itemType)
	items: Item[];
}
