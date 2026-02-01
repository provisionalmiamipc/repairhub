import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentTypeDto } from './create-payment_type.dto';

export class UpdatePaymentTypeDto extends PartialType(CreatePaymentTypeDto) {}
