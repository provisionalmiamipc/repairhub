import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSONoteDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	serviceOrderId: number;

	@IsOptional()
	note?: string;

	@IsInt()
	createdById: number;
}
