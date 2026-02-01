import { Exclude } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";
import { Center } from "../../centers/entities/center.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { Item } from "../../item/entities/item.entity";
import { ServiceOrder } from "../../service_orders/entities/service_order.entity";
import { Store } from "../../stores/entities/store.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('s_o_items')
export class SOItem {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Center, (center) => center.soitems)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.soitems)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
    centerId: number;

    @Column('int')
    storeId: number;

    
    @ManyToOne(() => ServiceOrder, serviceOrder => serviceOrder.soitems )
    @JoinColumn({ name: 'serviceOrderId' })
    serviceOrder: ServiceOrder;

    @Column('int')
    serviceOrderId: number;

    
    @ManyToOne(() => Item)
    @JoinColumn({ name: 'itemId' })
    item: Item;

    @Column('int')
    itemId: number;

    @Column({type: 'int', default: 1})
    @IsInt()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    @IsNumber()
    cost: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    @IsNumber()
    price: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    @IsNumber()
    discount: number;

    @Column({nullable: true})
    @IsOptional()
    note?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => Employee, employee => employee.soitems)
    @JoinColumn({ name: 'createdById' })
    employee: Employee;

    @Column('int', { nullable: true })
    createdById?: number;

    /*@ManyToOne(() => Employee)
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: Employee;*/
}
