import { IsInt, IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateRepairStatusDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	serviceOrderId: number;

	@IsString()
	@IsNotEmpty()
	@Length(6, 20)
	status: string;

	@IsInt()
	createdById: number;
}
