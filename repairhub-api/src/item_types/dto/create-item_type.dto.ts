import { IsInt, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateItemTypeDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsBoolean()
	isActive: boolean;
}

