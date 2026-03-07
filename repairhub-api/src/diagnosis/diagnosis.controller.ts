import { Body, Controller, Post } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosticNextDto } from './dto/diagnostic-next.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Diagnosis')
@Controller('repair-assistant/diagnostic')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('next')
  @ApiOperation({ summary: 'Mode 3: next step of the interactive diagnosis assistant' })
  @ApiResponse({ status: 201, description: 'Next question/action from the diagnosis tree' })
  next(@Body() dto: DiagnosticNextDto) {
    return this.diagnosisService.next(dto);
  }
}
