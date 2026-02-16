import { PartialType } from '@nestjs/mapped-types';
import { CreateReceivedPartDto } from './create-received-part.dto';

export class UpdateReceivedPartDto extends PartialType(CreateReceivedPartDto) {}
