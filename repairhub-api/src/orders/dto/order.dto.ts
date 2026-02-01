import { IsInt, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  customerId: number;

  @IsNumber()
  totalPrice: number;

  @IsNumber()
  totalCost: number;

  @IsNumber()
  tax: number;

  @IsOptional()
  note?: string;

  @IsOptional()
  @IsBoolean()
  cloused?: boolean;

  @IsOptional()
  @IsBoolean()
  canceled?: boolean;

  @IsInt()
  createdBy: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  note?: any;

  @IsOptional()
  @IsBoolean()
  cloused?: boolean;

  @IsOptional()
  @IsBoolean()
  canceled?: boolean;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
