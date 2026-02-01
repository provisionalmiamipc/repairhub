import { IsInt, IsEnum, IsOptional, IsString } from "class-validator";
import { Center } from "../../centers/entities/center.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { Item } from "../../item/entities/item.entity";
import { Store } from "../../stores/entities/store.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from "class-transformer";

@Entity('inventory_movements')
export class InventoryMovement {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    @IsString()
    inventoryMovementCode: string;

    @ManyToOne(() => Center, (center) => center.inventoryMovements)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.inventoryMovements)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
    centerId: number;

    @Column('int')
    storeId: number;

    @Exclude()
    @ManyToOne(() => Item, (item) => item.inentoryMovement)
    @JoinColumn({ name: 'itemId' })
    item: Item;

    @Column('int')
    itemId: number;

    @Column({type: 'int', default: 1})
    @IsInt()
    quantity: number;

    @Column({ type: 'enum', enum: ['Incoming', 'Outgoing'] })
    @IsEnum(['Incoming', 'Outgoing'])
    movementType: 'Incoming' | 'Outgoing';

    @Column({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;
    
    @ManyToOne(() => Employee, employee => employee.inventoryMovements)
    @JoinColumn({ name: 'createdById' })
    employee: Employee;

    @Column('int')
    createdById: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    
}
