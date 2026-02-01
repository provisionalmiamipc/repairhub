import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SOItemsService } from './s_o_items.service';
import { SOItemsController } from './s_o_items.controller';
import { SOItem } from './entities/s_o_item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SOItem])],
  controllers: [SOItemsController],
  providers: [SOItemsService],
})
export class SOItemsModule {}
