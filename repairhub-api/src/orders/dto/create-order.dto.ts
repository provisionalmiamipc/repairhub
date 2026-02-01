import { IsInt, IsNumber, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateOrderDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	customerId: number;

	@IsNumber()
	totalPrice: number;

	@IsNumber()
	totalCost: number;

	@IsNumber()
	tax: number;

	@IsNumber()
	advancePayment: number;

	@IsInt()
	paymentTypeId: number;

	@IsOptional()
	note?: string;

	@IsBoolean()
	cloused: boolean;

	@IsBoolean()
	canceled: boolean;

	@IsInt()
	createdById: number;

	/*@IsInt()
	updatedBy: number;*/
}
