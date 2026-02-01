
import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {

	@IsOptional()
	@IsInt()
	id?: number;

	@IsOptional()
	@IsString()
	appointmentCode?: string;

	@IsOptional()
	@IsDateString()
	createdAt?: string;

	@IsOptional()
	@IsDateString()
	updatedAt?: string;

}
