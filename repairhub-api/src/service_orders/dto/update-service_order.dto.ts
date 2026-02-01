import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOrderDto } from './create-service_order.dto';

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {}
