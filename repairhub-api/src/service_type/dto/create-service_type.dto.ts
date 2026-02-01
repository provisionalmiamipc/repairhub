import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServiceTypeDto {
  
  @IsInt()
  @IsNotEmpty()
  centerId: number;

  @IsInt()
  @IsNotEmpty()
  storeId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
