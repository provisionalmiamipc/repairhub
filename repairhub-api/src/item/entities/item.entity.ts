import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, IsInt } from 'class-validator';
import { ItemType } from '../../item_types/entities/item_type.entity';
import { Exclude } from 'class-transformer';

@Entity('items')
export class Item {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	@IsString()
	itemCode: string;

	@ManyToOne(() => Center, (center) => center.items)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.items)
	@JoinColumn({ name: 'storeId' })
	store: Store;

	@Column('int')
	centerId: number;

	@Column('int')
	storeId: number;

	@Column()
	@IsString()
	@IsNotEmpty()
	product: string;

	@Column()
	@IsString()
	@IsNotEmpty()
	sku: string;

	@Column('decimal', { precision: 10, scale: 2, default: 0 })
	@IsNumber()
	price: number;

	@Column('decimal', { precision: 10, scale: 2, default: 0 })
	@IsNumber()
	cost: number;

	@ManyToOne(() => ItemType, itemtype => itemtype.items)
	@JoinColumn({ name: 'itemTypeId' })
	itemType: ItemType;

	@Column('int')
	itemTypeId: number;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	shortTitleDesc?: string;

	@Column('int', { default: 0 })
	@IsInt()
	stock: number;

	@Column('int', { default: 0 })
	@IsInt()
	minimunStock: number;

	@Column({ type: 'json', nullable: true })
	@IsOptional()
	specs?: any;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	image?: string;

	@Column({ nullable: true })
	@IsOptional()
	@IsString()
	barcode?: string;

	@Column({ default: false })
	@IsBoolean()
	taxable: boolean;

	@Column({ default: 0 })
	@IsInt()
	warranty: number;

	@Column('decimal', { precision: 10, scale: 2, default: 0 })
	@IsNumber()
	discount: number;

	@Column({ default: true })
	@IsBoolean()
	isActive: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	orderItems: any;
	saleItems: any;
    inentoryMovement: any;
}
