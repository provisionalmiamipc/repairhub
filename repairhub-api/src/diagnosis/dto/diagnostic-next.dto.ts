import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiagnosticNextDto {
  @ApiProperty({ example: '123' })
  @IsString()
  @MinLength(1)
  serviceOrderId: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  device: string;

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

  @ApiPropertyOptional({ example: 'yes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  answer?: string;
}
