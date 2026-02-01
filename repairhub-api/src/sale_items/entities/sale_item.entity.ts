import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { IsInt } from 'class-validator';
import { Item } from '../../item/entities/item.entity';
import { Exclude } from 'class-transformer';

@Entity('sale_items')
export class SaleItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Center, (center) => center.saleItems)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.saleItems)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
    centerId: number;

    @Column('int')
    storeId: number;

    @ManyToOne(() => Sale, sale => sale.saleItems)
    @JoinColumn({ name: 'saleId' })
    sale: Sale;

    @Column('int')
    saleId: number;

    @ManyToOne(() => Item, item => item.saleItems)
    @JoinColumn({ name: 'itemId' })
    item: Item;

    @Column('int')
    itemId: number;

    @Column({ type: 'int', default: 1 })
    @IsInt()
    quantity: number;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'createdByI' })
    employee: Employee;

    @Column('int')
    createdById;

    /*@ManyToOne(() => Employee)
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: Employee;*/

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    cost: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    discount: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
