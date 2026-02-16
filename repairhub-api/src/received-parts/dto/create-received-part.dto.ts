import { IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateReceivedPartDto {
  @IsInt()
  centerId: number;

  @IsInt()
  storeId: number;

  @IsInt()
  serviceOrderId: number;

  @IsString()
  @IsNotEmpty()
  accessory: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsInt()
  createdById?: number | null;
}
