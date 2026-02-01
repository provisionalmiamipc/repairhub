import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateSaleDto {
  @IsInt()
  centerId: number;

  @IsInt()
  storeId: number;

  @IsInt()
  createdBy: number;

  @IsInt()
  updatedBy: number;

  @IsNumber()
  totalCost: number;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsInt()
  paymentTypeId: number;

  @IsNumber()
  totalDiscount: number;
}

export class UpdateSaleDto {
  @IsOptional()
  @IsInt()
  centerId?: number;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsInt()
  paymentTypeId?: number;

  @IsOptional()
  @IsNumber()
  totalDiscount?: number;
}
