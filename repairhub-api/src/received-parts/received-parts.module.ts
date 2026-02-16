import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivedPartsService } from './received-parts.service';
import { ReceivedPartsController } from './received-parts.controller';
import { ReceivedPart } from './entities/received-part.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReceivedPart])],
  controllers: [ReceivedPartsController],
  providers: [ReceivedPartsService],
  exports: [ReceivedPartsService],
})
export class ReceivedPartsModule {}
