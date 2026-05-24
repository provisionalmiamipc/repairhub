import { IsInt, IsOptional, IsString } from 'class-validator';

export class VoidWarrantyDto {
  @IsString()
  warrantyVoidReason: string;

  @IsOptional()
  @IsString()
  warrantyVoidNotes?: string;

  @IsOptional()
  @IsInt()
  voidedById?: number | null;
}
