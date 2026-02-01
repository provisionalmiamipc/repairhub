
import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-item.dto';
import { IsOptional } from 'class-validator';

export class UpdateItemDto extends PartialType(CreateItemDto) {
	@IsOptional()
	specs?: any;

	@IsOptional()
	discount?: number;
}
