
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, IsInt } from 'class-validator';


export class CreateItemDto {
	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

	@IsString()
	@IsNotEmpty()
	product: string;

	@IsString()	
	sku: string;

	@IsNumber()
	price: number;

	@IsNumber()
	cost: number;

	@IsInt()
	itemTypeId: number;

	@IsOptional()
	@IsString()
	shortTitleDesc?: string;

	@IsInt()
	stock: number;

	@IsInt()
	minimunStock: number;

	@IsOptional()
	specs?: any;

	@IsOptional()
	@IsString()
	image?: string;

	@IsOptional()
	@IsString()
	barcode?: string;

	@IsBoolean()
	taxable: boolean;

	@IsInt()
	warranty: number;

	@IsNumber()
	discount: number;

	@IsBoolean()
	isActive?: boolean;
}

