import { Exclude } from "class-transformer";
import { IsBoolean } from "class-validator";
import { Center } from "../../centers/entities/center.entity";
import { Employee } from "../../employees/entities/employee.entity";
import { ServiceOrder } from "../../service_orders/entities/service_order.entity";
import { Store } from "../../stores/entities/store.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('s_o_diagnostic')
export class SODiagnostic {

    @PrimaryGeneratedColumn()
    id: number;
     
    @ManyToOne(() => Center, (center) => center.sodiagnostic)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.sodiagnostic)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column()
	centerId: number;

	@Column()
	storeId: number;

    
    @ManyToOne(() => ServiceOrder, serviceOrder => serviceOrder.sodiagnostic)
    @JoinColumn({ name: 'serviceOrderId' })
    serviceOrder: ServiceOrder;

    @Column()
    serviceOrderId: number;
    
    @Column()    
    diagnostic: string;

    @Column({ default: false })
    @IsBoolean()
    sendEmail: boolean;
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
    
    
    @ManyToOne(() => Employee, employee => employee.sodiagnostic)
    @JoinColumn({ name: 'createdById' })
    employee: Employee;

    @Column()
    createdById: number;
}
