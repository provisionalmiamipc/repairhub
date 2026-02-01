import { PartialType } from '@nestjs/mapped-types';
import { CreateDeviceBrandDto } from './create-device_brand.dto';

export class UpdateDeviceBrandDto extends PartialType(CreateDeviceBrandDto) {
	
}
