import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SODiagnosticService } from './s_o_diagnostic.service';
import { CreateSODiagnosticDto } from './dto/create-s_o_diagnostic.dto';
import { UpdateSODiagnosticDto } from './dto/update-s_o_diagnostic.dto';

@Controller('s-o-diagnostic')
export class SODiagnosticController {
  constructor(private readonly sODiagnosticService: SODiagnosticService) {}

  @Post()
  create(@Body() createSODiagnosticDto: CreateSODiagnosticDto) {
    return this.sODiagnosticService.create(createSODiagnosticDto);
  }

  @Get()
  findAll() {
    return this.sODiagnosticService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sODiagnosticService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSODiagnosticDto: UpdateSODiagnosticDto) {
    return this.sODiagnosticService.update(id, updateSODiagnosticDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sODiagnosticService.remove(id);
  }
}
