import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RepairCasesService } from './repair_cases.service';
import { CreateRepairCaseDto } from './dto/create-repair_case.dto';
import { UpdateRepairCaseDto } from './dto/update-repair_case.dto';

@Controller('repair-cases')
export class RepairCasesController {
  constructor(private readonly repairCasesService: RepairCasesService) {}

  @Post()
  create(@Body() createRepairCaseDto: CreateRepairCaseDto) {
    return this.repairCasesService.create(createRepairCaseDto);
  }

  @Get()
  findAll() {
    return this.repairCasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repairCasesService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRepairCaseDto: UpdateRepairCaseDto) {
    return this.repairCasesService.update(Number(id), updateRepairCaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repairCasesService.remove(Number(id));
  }
}
