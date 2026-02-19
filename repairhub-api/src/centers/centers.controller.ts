import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {
  }

  @Post()
  @Post('create') 
  create(@Body() createCenterDto: CreateCenterDto) {
    return this.centersService.create(createCenterDto);
  }

  @Get('test')
  test() {
    return { message: 'Controller funciona', timestamp: new Date() };
  }

  @Get()
  findAll() {
    return this.centersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.centersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateCenterDto: UpdateCenterDto) {
    return this.centersService.update(id, updateCenterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.centersService.remove(id);
  }
}
