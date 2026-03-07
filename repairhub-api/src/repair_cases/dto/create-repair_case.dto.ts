import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRepairCaseDto {
  @IsString()
  @MaxLength(255)
  brand: string;

  @IsString()
  @MaxLength(255)
  model: string;

  @IsString()
  defect: string;

  @IsString()
  symptoms: string;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsArray()
  resolutionSteps?: any[];
}
