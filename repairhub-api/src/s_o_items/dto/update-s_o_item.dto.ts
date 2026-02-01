import { PartialType } from '@nestjs/mapped-types';
import { CreateSOItemDto } from './create-s_o_item.dto';

export class UpdateSOItemDto extends PartialType(CreateSOItemDto) {}
