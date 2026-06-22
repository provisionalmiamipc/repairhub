import { IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateEstimateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  defectivePart: string;
}
