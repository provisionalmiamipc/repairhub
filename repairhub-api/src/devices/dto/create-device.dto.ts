import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDeviceDto {
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
}
