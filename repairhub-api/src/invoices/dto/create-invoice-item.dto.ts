import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { InvoiceItemType } from '../entities/invoice-item.entity';

export class CreateInvoiceItemDto {
  @IsIn(['service', 'part', 'labor', 'custom'])
  itemType: InvoiceItemType;

  @IsOptional()
  @IsInt()
  itemId?: number;

  @IsOptional()
  @IsInt()
  serviceOrderId?: number;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
