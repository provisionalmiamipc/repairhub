import { IsInt, IsDateString, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  customer: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  deviceTypeid: number;

  @IsString()
  serviceTypeid: number;

  @IsInt()
  duration: number;

  @IsOptional()
  notes?: any;

  @IsString()
  employeeid: number;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsInt()
  customer?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsInt()
  deviceTypeId?: number;

  @IsOptional()
  @IsInt()
  serviceTypeId?: number;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  notes?: any;

  @IsOptional()
  @IsInt()
  employeeId?: number;
}
