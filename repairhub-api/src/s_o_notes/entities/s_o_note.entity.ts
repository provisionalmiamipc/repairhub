import { Exclude } from "class-transformer";
import { Center } from "../../centers/entities/center.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { ServiceOrder } from "../../service_orders/entities/service_order.entity";
import { Store } from "../../stores/entities/store.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('s_o_notes')
export class SONote {

    @PrimaryGeneratedColumn()
    id: number;
    
    @ManyToOne(() => Center, (center) => center.sonotes)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.sonotes)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
    centerId: number;

    @Column('int')
    storeId: number;

    @ManyToOne(() => ServiceOrder, serviceOrder => serviceOrder.sonotes)
    @JoinColumn({ name: 'serviceOrderId' })
    serviceOrder: ServiceOrder;

    @Column('int')
    serviceOrderId: number;

    @Column()    
    note: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => Employee, employee => employee.sonotes)
    @JoinColumn({ name: 'createdById' })
    employee: Employee;

    @Column('int')
    createdById: number;
}
