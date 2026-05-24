import { IsOptional, IsString } from 'class-validator';

export class RecordPaymentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
