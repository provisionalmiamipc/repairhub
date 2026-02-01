import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceDto } from './create-device.dto';

import { IsString, IsOptional } from 'class-validator';

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;
}

