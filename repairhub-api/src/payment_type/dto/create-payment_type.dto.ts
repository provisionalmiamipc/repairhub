import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentTypeDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsString()
	@IsNotEmpty()
	type: string;

	@IsOptional()
	@IsString()
	description?: string;
}
