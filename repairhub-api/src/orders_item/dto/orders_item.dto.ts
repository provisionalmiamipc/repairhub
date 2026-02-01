import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrdersItemDto {
  @IsInt()
  orderId: number;

  @IsInt()
  itemId: number;

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
  note?: any;

  @IsInt()
  createdBy: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}

export class UpdateOrdersItemDto {
  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsInt()
  itemId?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  note?: any;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
