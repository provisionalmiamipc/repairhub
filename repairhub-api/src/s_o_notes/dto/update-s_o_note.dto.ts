import { PartialType } from '@nestjs/mapped-types';
import { CreateSONoteDto } from './create-s_o_note.dto';

export class UpdateSONoteDto extends PartialType(CreateSONoteDto) {}
