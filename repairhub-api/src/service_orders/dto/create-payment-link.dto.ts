import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreatePaymentLinkDto {
  @IsIn(['total', 'advance_payment', 'pending_payment', 'pickup', 'delivery', 'custom'])
  concept: 'total' | 'advance_payment' | 'pending_payment' | 'pickup' | 'delivery' | 'custom';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(1)
  @Max(999999999999)
  amount: number;
}
