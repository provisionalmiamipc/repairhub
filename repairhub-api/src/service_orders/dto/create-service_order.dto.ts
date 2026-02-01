import { IsInt, IsNumber, IsOptional, IsBoolean, IsString } from 'class-validator';

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
}
