import { PartialType } from '@nestjs/mapped-types';
import { CreateSODiagnosticDto } from './create-s_o_diagnostic.dto';

export class UpdateSODiagnosticDto extends PartialType(CreateSODiagnosticDto) {}
