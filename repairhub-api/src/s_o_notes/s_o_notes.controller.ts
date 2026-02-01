import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SONotesService } from './s_o_notes.service';
import { CreateSONoteDto } from './dto/create-s_o_note.dto';
import { UpdateSONoteDto } from './dto/update-s_o_note.dto';

@Controller('s-o-notes')
export class SONotesController {
  constructor(private readonly sONotesService: SONotesService) {}

  @Post()
  create(@Body() createSONoteDto: CreateSONoteDto) {
    return this.sONotesService.create(createSONoteDto);
  }

  @Get()
  findAll() {
    return this.sONotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sONotesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateSONoteDto: UpdateSONoteDto) {
    return this.sONotesService.update(id, updateSONoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sONotesService.remove(id);
  }
}
