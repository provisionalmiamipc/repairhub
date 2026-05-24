import { IsInt, IsNumber, IsOptional, IsBoolean, IsString, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReceivedPartNestedDto } from './create-received-part-nested.dto';
import type { WarrantyDurationUnit } from '../../warranties/entities/warranty.entity';
import type { WarrantyDecision } from '../entities/service_order.entity';

export class CreateServiceOrderDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	customerId: number;

	@IsInt()
	deviceId: number;

	@IsInt()
	deviceBrandId: number;

	@IsOptional()
	@IsString()
	model?: string;

	@IsOptional()
	@IsString()
	defectivePart?: string;

	@IsOptional()
	@IsString()
	serial?: string;

	@IsBoolean()
	lock: boolean;

	@IsNumber()
	price: number;

	@IsNumber()
	repairCost: number;

	@IsNumber()
	totalCost: number;

	@IsNumber()
	costdiscount: number;

	@IsNumber()
	advancePayment: number;

	@IsString()
	noteReception?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	warrantyDuration?: number;

	@IsOptional()
	@IsIn(['days', 'months', 'years'])
	warrantyDurationUnit?: WarrantyDurationUnit;

	@IsString()
	estimated?: string;

	@IsOptional()
	@IsBoolean()
	isWarrantyOrder?: boolean;

	@IsOptional()
	@IsInt()
	originalServiceOrderId?: number | null;

	@IsOptional()
	@IsInt()
	warrantyId?: number | null;

	@IsOptional()
	@IsIn(['pending', 'approved', 'rejected'])
	warrantyDecision?: WarrantyDecision | null;

	@IsOptional()
	@IsString()
	warrantyDecisionReason?: string | null;

	@IsInt()
	paymentTypeId: number;

	@IsNumber()
	tax: number;

	@IsInt()
	assignedTechId: number;
	
	@IsBoolean()
	cloused: boolean;
	
	@IsBoolean()
	canceled: boolean;
    
	@IsInt()
	createdById: number;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateReceivedPartNestedDto)
	receivedParts?: CreateReceivedPartNestedDto[];
}
