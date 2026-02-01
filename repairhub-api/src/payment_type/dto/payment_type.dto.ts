import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreatePaymentTypeDto {
  @IsInt()
  centerId: number;

  @IsInt()
  storeId: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePaymentTypeDto {
  @IsOptional()
  @IsInt()
  centerId?: number;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
