import { IsOptional, IsString, IsInt, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateReceivedPartNestedDto {
  @IsString()
  @IsNotEmpty()
  accessory: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  centerId?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  storeId?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  createdById?: number | null;
}
