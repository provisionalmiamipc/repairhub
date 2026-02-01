import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';


export class CreateInventoryMovementDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	itemId: number;

	@IsInt()
	quantity: number;

	@IsEnum(['Incoming', 'Outgoing'])
	movementType: 'Incoming' | 'Outgoing';

	@IsOptional()
	@IsString()
	description?: string;

	@IsInt()
	createdById: number;
}
