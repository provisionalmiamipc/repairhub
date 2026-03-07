import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendDto {
  @ApiProperty({ example: '123' })
  @IsString()
  @MinLength(1)
  serviceOrderId: string;

  @ApiPropertyOptional({ example: 'Laptop' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  device?: string;

  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  brand?: string;

  @ApiPropertyOptional({ example: 'Latitude 5420' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  @ApiPropertyOptional({ example: 'no enciende' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  defect?: string;

  @ApiPropertyOptional({ type: [String], example: ['10', '11'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsString({ each: true })
  documentIds?: string[];
}
