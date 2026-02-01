import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemTypesService } from './item_types.service';
import { ItemTypesController } from './item_types.controller';
import { ItemType } from './entities/item_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemType])],
  controllers: [ItemTypesController],
  providers: [ItemTypesService],
})
export class ItemTypesModule {}
