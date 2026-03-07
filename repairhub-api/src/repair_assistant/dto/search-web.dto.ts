import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchWebDto {
  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  device: string;

  @ApiProperty({ example: 'Dell' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  brand: string;

  @ApiProperty({ example: 'Latitude 5420' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  model: string;

  @ApiProperty({ example: 'battery not charging' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  defect: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
