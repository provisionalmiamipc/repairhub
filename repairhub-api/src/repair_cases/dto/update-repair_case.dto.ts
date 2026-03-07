import { PartialType } from '@nestjs/mapped-types';
import { CreateRepairCaseDto } from './create-repair_case.dto';

export class UpdateRepairCaseDto extends PartialType(CreateRepairCaseDto) {}
