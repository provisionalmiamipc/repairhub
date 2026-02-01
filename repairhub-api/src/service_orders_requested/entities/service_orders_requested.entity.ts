import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { Center } from "../../centers/entities/center.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { Order } from "../../orders/entities/order.entity";
import { ServiceOrder } from "../../service_orders/entities/service_order.entity";
import { Store } from "../../stores/entities/store.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Exclude } from "class-transformer";

@Entity('service_order_requeste')
export class ServiceOrdersRequested {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Center, (center) => center.soRequested)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.soRequested)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
    centerId: number;

    @Column('int')
    storeId: number;

    
    @ManyToOne(() => ServiceOrder, (serviceOrder) => serviceOrder.soRequested)
    @JoinColumn({ name: 'serviceOrderId' })
    serviceOrder: ServiceOrder;

    @Column('int')
    serviceOrderId: number;
    
    @ManyToOne(() => Order, order => order.soRequested)
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column('int')
    orderId: number;

    @Column({ nullable: false })
    @IsString()
    @IsNotEmpty()
    status: string;

    @Column({ default: false })
    @IsBoolean()
    cloused: boolean;

    @Column({ default: false })
    @IsBoolean()
    canceled: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

   /* @ManyToOne(() => Employee)
    @JoinColumn({ name: 'createdBy' })
    createdBy: Employee;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: Employee;   */ 

}
