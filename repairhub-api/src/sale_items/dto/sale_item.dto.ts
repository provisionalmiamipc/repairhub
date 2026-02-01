import { IsInt, IsNumber, IsString } from 'class-validator';

export class CreateSaleItemDto {
  @IsString()
  centerid: number;

  @IsString()
  storeid: number;

  @IsString()
  saleid: number;

 /* @IsInt()
  createdBy: number;

  @IsInt()
  updatedBy: number;*/

  @IsNumber()
  cost: number;

  @IsNumber()
  price: number;

  @IsNumber()
  discount: number;
}

export class UpdateSaleItemDto {
  @IsString()
  centerId?: string;

  @IsString()
  storeId?: string;

  @IsInt()
  saleId?: string;

  @IsString()
  createdBy?: string;

  @IsInt()
  updatedBy?: number;

  @IsNumber()
  cost?: number;

  @IsNumber()
  price?: number;

  @IsNumber()
  discount?: number;
}
