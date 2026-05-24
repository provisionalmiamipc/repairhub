import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateWarrantyOrderDto {
  @IsOptional()
  @IsInt()
  assignedTechId?: number | null;

  @IsOptional()
  @IsInt()
  createdById?: number | null;

  @IsOptional()
  @IsString()
  noteReception?: string;
}
