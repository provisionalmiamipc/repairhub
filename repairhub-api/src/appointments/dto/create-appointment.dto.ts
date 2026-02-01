import { IsInt, IsDateString, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
	@IsNotEmpty()
	centerId: number;

	@IsNotEmpty()
	storeId: number;

	@IsString()
	customer: string;

	@IsDateString()
	date: string;

	@IsString()
	@IsNotEmpty()
	time: string;

	@IsInt()
	deviceId: number;

	@IsInt()
	serviceTypeId: number;

	@IsInt()
	duration: number;

	@IsOptional()
	notes?: any;

	@IsOptional()
	@IsInt()
	createdById?: number | null;

	@IsOptional()
	cloused: boolean;

	@IsOptional()
	canceled: boolean;
}
