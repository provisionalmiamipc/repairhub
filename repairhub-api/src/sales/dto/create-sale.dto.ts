import { IsInt, IsNumber, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSaleDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	createdById: number;

	/*@IsInt()
	updatedBy: number;*/

	@IsNumber()
	totalCost: number;

	@IsNumber()
	totalPrice: number;

	@IsInt()
	@IsOptional()
	customerId?: number;

	@IsInt()
	paymentTypeId: number;

	@IsNumber()
	totalDiscount: number;

	@IsBoolean()
	cloused: boolean;

	@IsBoolean()
	canceled: boolean;
}
