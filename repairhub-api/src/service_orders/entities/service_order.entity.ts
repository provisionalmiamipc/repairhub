import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';
import { Store } from '../../stores/entities/store.entity';
import { IsInt, IsNumber, IsOptional, IsBoolean, IsString } from 'class-validator';
import { Customer } from '../../customers/entities/customer.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Device } from '../../devices/entities/device.entity';
import { DeviceBrand } from '../../device_brands/entities/device_brand.entity';
import { PaymentType } from '../../payment_type/entities/payment_type.entity';
import { SONote } from '../../s_o_notes/entities/s_o_note.entity';
import { SODiagnostic } from '../../s_o_diagnostic/entities/s_o_diagnostic.entity';
import { RepairStatus } from '../../repair_status/entities/repair_status.entity';
import { SOItem } from '../../s_o_items/entities/s_o_item.entity';
import { ServiceOrdersRequested } from '../../service_orders_requested/entities/service_orders_requested.entity';
import { Exclude } from 'class-transformer';



@Entity('service_orders')
export class ServiceOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Center, (center) => center.serviceOrders)
	@JoinColumn({ name: 'centerId' })
	center: Center;

	@ManyToOne(() => Store, (store) => store.serviceOrders)
	@JoinColumn({ name: 'storeId' })
	store: Store;

    @Column('int')
    centerId: number;

    @Column('int')
    storeId: number;

    @Column({ unique: true })
    @IsString()
    orderCode: string;

    
    @ManyToOne(() => Customer, customer => customer.serviceOrders)
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column('int')
    customerId: number;

    @ManyToOne(() => Device, device => device.serviceOrders)
    @JoinColumn({ name: 'deviceId'})
    device: Device;

    @Column('int')
    deviceId: number;

    
    @ManyToOne(() => DeviceBrand, deviceBrand => deviceBrand.serviceOrders)
    @JoinColumn({ name: 'deviceBrandId'})
    deviceBrand: DeviceBrand;

    @Column('int')
    deviceBrandId: number;

    @Column()
    @IsString()
    @IsOptional()
    model: string;

    @Column()
    @IsString()
    @IsOptional()
    defectivePart: string;

    @Column()
    @IsString()
    @IsOptional()
    serial: string;

    @Column({ default: false })
	@IsBoolean()
	lock: boolean;

    @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
	@IsNumber()
	price: number;

	@Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
	@IsNumber()
	repairCost: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
	@IsNumber()
	totalCost: number;

	@Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
	@IsNumber()
	costdiscount: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
    @IsNumber()
    advancePayment: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
    @IsNumber()
    tax: number;

    
    @ManyToOne(() => PaymentType, paymentType => paymentType.serviceOrders)
    @JoinColumn({ name: 'paymentTypeId' })
    paymentType?: PaymentType;

    @Column()
    paymentTypeId: number;

    
    @ManyToOne(() => Employee, employee => employee.assignedTech)
    @JoinColumn({ name: 'assignedTechId' })
    assignedTech: Employee;

    @Column()
    assignedTechId: number;

    @Column()
    @IsOptional()
    noteReception?: string;

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
    //repairStatus: any;
    //sodiagnostic: any;
    //soitems: any;
    //sonotes: any;

    @ManyToOne(() => Employee, employee => employee.cserviceOrders)
    @JoinColumn({ name: 'createdById' })
    employee: Employee;

    @Column('int')
    createdById: number;

    /*@ManyToOne(() => Employee)
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: Employee;*/

    @OneToMany(() => SONote, (SONote) => SONote.serviceOrder)
    sonotes: SONote[];

    @OneToMany(() => SODiagnostic, (SODiagnostic) => SODiagnostic.serviceOrder)
    sodiagnostic: SONote[];

    @OneToMany(() => RepairStatus, (repairStatus) => repairStatus.serviceOrder)
    repairStatus: RepairStatus[];

    @OneToMany(() => SOItem, (SOItem) => SOItem.serviceOrder)
    soitems: SOItem[];

    @OneToMany(() => ServiceOrdersRequested, (soRequested) => soRequested.serviceOrder)
    soRequested: ServiceOrdersRequested[];

}
