import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOrdersRequestedDto } from './create-service_orders_requested.dto';

export class UpdateServiceOrdersRequestedDto extends PartialType(CreateServiceOrdersRequestedDto) {}
