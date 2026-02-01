import { PartialType } from '@nestjs/mapped-types';
import { CreateItemTypeDto } from './create-item_type.dto';

export class UpdateItemTypeDto extends PartialType(CreateItemTypeDto) {}
