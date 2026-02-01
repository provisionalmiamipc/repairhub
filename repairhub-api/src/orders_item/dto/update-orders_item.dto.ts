import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdersItemDto } from './create-orders_item.dto';

export class UpdateOrdersItemDto extends PartialType(CreateOrdersItemDto) {}
