import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDeviceBrandDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsString()
	@IsNotEmpty()
	name: string;

	@IsOptional()
	@IsString()
	img?: string;

	@IsOptional()
	@IsString()
	description?: string;
}
