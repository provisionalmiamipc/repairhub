import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {
    console.log('✅ CenterController instanciado');
  }

  @Post()
  @Post('create') 
  create(@Body() createCenterDto: CreateCenterDto) {

    console.log('📨 Body recibido:', createCenterDto);
    console.log('🔍 Tipo de dato:', typeof createCenterDto);
    console.log('📊 Keys del objeto:', Object.keys(createCenterDto));

    return this.centersService.create(createCenterDto);
  }

  @Get('test')
  test() {
    console.log('✅ GET /centers/test - LLEGÓ AL CONTROLADOR!');
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
    console.log('Fecha recibida:', updateCenterDto.completion)
    return this.centersService.update(id, updateCenterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.centersService.remove(id);
  }
}
