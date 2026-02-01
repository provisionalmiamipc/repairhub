import { IsInt, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateServiceOrdersRequestedDto {
	@IsString()
	centerId: number;

	@IsString()
	storeId: number;

	@IsString()
	serviceOrderId: number;

	@IsString()
	orderId: number;

	@IsString()
	@IsNotEmpty()
	status: string;

	@IsBoolean()
	cloused: boolean;

	@IsBoolean()
	canceled: boolean;

	/*@IsInt()
	createdBy: number;

	@IsInt()
	updatedBy: number;*/
}
