import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleItemsService } from './sale_items.service';
import { SaleItemsController } from './sale_items.controller';
import { SaleItem } from './entities/sale_item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SaleItem])],
  controllers: [SaleItemsController],
  providers: [SaleItemsService],
})
export class SaleItemsModule {}
