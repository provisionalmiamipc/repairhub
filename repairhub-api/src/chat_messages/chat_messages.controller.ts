import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ChatMessagesService } from './chat_messages.service';
import { CreateChatMessageDto } from './dto/create-chat_message.dto';
import { UpdateChatMessageDto } from './dto/update-chat_message.dto';

@Controller()
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Post('chat-messages')
  create(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatMessagesService.create(createChatMessageDto);
  }

  @Get('chat-messages')
  findAll() {
    return this.chatMessagesService.findAll();
  }

  @Get('chat-messages/:id')
  findOne(@Param('id') id: number) {
    return this.chatMessagesService.findOne(id);
  }

  @Patch('chat-messages/:id')
  update(@Param('id') id: number, @Body() updateChatMessageDto: UpdateChatMessageDto) {
    return this.chatMessagesService.update(id, updateChatMessageDto);
  }

  @Delete('chat-messages/:id')
  remove(@Param('id') id: number) {
    return this.chatMessagesService.remove(id);
  }

  @Get('service-orders/:id/chat')
  getChatHistory(@Param('id') id: number) {
    return this.chatMessagesService.findByServiceOrder(id);
  }
}
