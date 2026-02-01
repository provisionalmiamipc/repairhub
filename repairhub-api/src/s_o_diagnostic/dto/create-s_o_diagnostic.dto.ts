import { IsInt, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSODiagnosticDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	serviceOrderId: number;

	@IsOptional()
	diagnostic?: string;

	@IsBoolean()
	sendEmail: boolean;

	@IsInt()
	createdById: number;
}
