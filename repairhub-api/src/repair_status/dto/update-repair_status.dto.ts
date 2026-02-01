import { PartialType } from '@nestjs/mapped-types';
import { CreateRepairStatusDto } from './create-repair_status.dto';

export class UpdateRepairStatusDto extends PartialType(CreateRepairStatusDto) {}
