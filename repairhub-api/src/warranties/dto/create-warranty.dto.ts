import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { WarrantyDurationUnit, WarrantyStatus } from '../entities/warranty.entity';

export class CreateWarrantyDto {
  @IsInt()
  centerId: number;

  @IsInt()
  storeId: number;

  @IsInt()
  serviceOrderId: number;

  @IsInt()
  customerId: number;

  @IsInt()
  deviceId: number;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsIn(['active', 'expired', 'void'])
  status?: WarrantyStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyDuration?: number;

  @IsOptional()
  @IsIn(['days', 'months', 'years'])
  warrantyDurationUnit?: WarrantyDurationUnit;

  @IsOptional()
  @IsDateString()
  warrantyStartDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyEndDate?: string;

  @IsOptional()
  @IsString()
  coverageSummary?: string;

  @IsOptional()
  @IsString()
  warrantyVoidReason?: string;

  @IsOptional()
  @IsString()
  warrantyVoidNotes?: string;

  @IsOptional()
  @IsInt()
  createdById?: number | null;
}
