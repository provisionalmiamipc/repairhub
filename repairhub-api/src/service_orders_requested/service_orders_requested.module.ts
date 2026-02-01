import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrdersRequestedService } from './service_orders_requested.service';
import { ServiceOrdersRequestedController } from './service_orders_requested.controller';
import { ServiceOrdersRequested } from './entities/service_orders_requested.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrdersRequested])],
  controllers: [ServiceOrdersRequestedController],
  providers: [ServiceOrdersRequestedService],
})
export class ServiceOrdersRequestedModule {}
