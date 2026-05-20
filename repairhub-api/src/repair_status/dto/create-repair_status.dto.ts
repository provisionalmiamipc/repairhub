import { IsInt, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRepairStatusDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	serviceOrderId: number;

	@IsString()
	@IsNotEmpty()
	@MaxLength(30)
	status: string;

	@IsInt()
	createdById: number;
}
