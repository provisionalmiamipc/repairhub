import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RepairStatusService } from './repair_status.service';
import { CreateRepairStatusDto } from './dto/create-repair_status.dto';
import { UpdateRepairStatusDto } from './dto/update-repair_status.dto';

@Controller('repair-status')
export class RepairStatusController {
  constructor(private readonly repairStatusService: RepairStatusService) {}

  @Post()
  create(@Body() createRepairStatusDto: CreateRepairStatusDto) {
    return this.repairStatusService.create(createRepairStatusDto);
  }

  @Get()
  findAll() {
    return this.repairStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.repairStatusService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateRepairStatusDto: UpdateRepairStatusDto) {
    return this.repairStatusService.update(id, updateRepairStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.repairStatusService.remove(id);
  }
}
