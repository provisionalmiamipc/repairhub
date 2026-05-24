import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  via?: string;

  @IsOptional()
  @IsString()
  billToName?: string;

  @IsOptional()
  @IsString()
  billToAddress?: string;

  @IsOptional()
  @IsString()
  billToContact?: string;

  @IsOptional()
  @IsString()
  serviceSummary?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  paymentInstructions?: string;

  @IsOptional()
  @IsInt()
  paymentTypeId?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;
}
