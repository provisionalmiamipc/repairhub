import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersItemService } from './orders_item.service';
import { OrdersItemController } from './orders_item.controller';
import { OrdersItem } from './entities/orders_item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrdersItem])],
  controllers: [OrdersItemController],
  providers: [OrdersItemService],
})
export class OrdersItemModule {}
