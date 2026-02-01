import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SONotesService } from './s_o_notes.service';
import { SONotesController } from './s_o_notes.controller';
import { SONote } from './entities/s_o_note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SONote])],
  controllers: [SONotesController],
  providers: [SONotesService],
})
export class SONotesModule {}
