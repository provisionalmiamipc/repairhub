import { IsNotEmpty, IsString, Length } from "class-validator";
import { Center } from "../../centers/entities/center.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { ServiceOrder } from "../../service_orders/entities/service_order.entity";
import { Store } from "../../stores/entities/store.entity";
import { PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Entity } from "typeorm";
import { Exclude } from "class-transformer";

@Entity('repair_status')
export class RepairStatus {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Center, (center) => center.repairStatus)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.repairStatus)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
	centerId: number;

	@Column('int')
	storeId: number;

    
    @ManyToOne(() => ServiceOrder, serviceOrder => serviceOrder.repairStatus)
    @JoinColumn({ name: 'serviceOrderId' })
    serviceOrder: ServiceOrder;
    
    @Column('int')
    serviceOrderId: number;

    @Column()
    @IsString()
    @IsNotEmpty()
    @Length(6,20)
    status: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => Employee, employee => employee.repairStatus)
    @JoinColumn({ name: 'createdById' })
    employee: Employee;

    @Column('int')
    createdById: number;
}
