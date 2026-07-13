import { IsString, MaxLength, MinLength } from 'class-validator';

export class TrackServiceOrderDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  contact: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  orderNumber: string;
}
