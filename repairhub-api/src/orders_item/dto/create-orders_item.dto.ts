import { IsInt, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateOrdersItemDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsInt()
	orderId: number;

	@IsInt()
	itemId: number;

	@IsInt()
	quantity: number;

	@IsNumber()
	cost: number;

	@IsNumber()
	price: number;

	@IsNumber()
	discount: number;

	@IsOptional()
	@IsString()
	image?: string;

	@IsString()
	link: string;

	@IsOptional()
	@IsString()
	condition?: string;

	@IsBoolean()
	received: boolean;

	@IsOptional()
	note?: string;

	@IsString()
	createdByid: number;

	/*@IsInt()
	updatedBy: number;*/
}
