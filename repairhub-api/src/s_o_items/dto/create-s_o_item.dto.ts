import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSOItemDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	serviceOrderId: number;

	@IsInt()
	itemId: number;

	@IsInt()
	@IsOptional()
	quantity?: number;

	@IsNumber()
	@IsOptional()
	cost?: number;

	@IsNumber()
	@IsOptional()
	price?: number;

	@IsNumber()
	@IsOptional()
	discount?: number;

	@IsOptional()
	note?: string;

	@IsInt()
	@IsOptional()
	createdById?: number;
}
