import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat_message.entity';
import { CreateChatMessageDto } from './dto/create-chat_message.dto';
import { UpdateChatMessageDto } from './dto/update-chat_message.dto';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async create(createChatMessageDto: CreateChatMessageDto) {
    const message = this.chatMessageRepository.create(createChatMessageDto);
    return this.chatMessageRepository.save(message);
  }

  async findAll() {
    return this.chatMessageRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: number) {
    const message = await this.chatMessageRepository.findOne({ where: { id } });
    if (!message) throw new NotFoundException(`chat_message ${id} not found`);
    return message;
  }

  async findByServiceOrder(serviceOrderId: number) {
    return this.chatMessageRepository.find({
      where: { serviceOrderId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: number, updateChatMessageDto: UpdateChatMessageDto) {
    await this.chatMessageRepository.update(id, updateChatMessageDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.chatMessageRepository.delete(id);
    return { deleted: true };
  }
}
