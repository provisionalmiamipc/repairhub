import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessagesController } from './chat_messages.controller';
import { ChatMessagesService } from './chat_messages.service';
import { ChatMessage } from './entities/chat_message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage])],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService],
  exports: [ChatMessagesService],
})
export class ChatMessagesModule {}
