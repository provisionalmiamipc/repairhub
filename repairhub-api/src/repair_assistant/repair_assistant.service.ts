import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfTextService } from './pdf-text.service';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { ChatMessage } from '../chat_messages/entities/chat_message.entity';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class RepairAssistantService {
  constructor(
    private readonly pdfTextService: PdfTextService,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly llmService: LlmService,
  ) {}

  async extractTextFromPdf(filePath: string) {
    const extracted = await this.pdfTextService.extractFromPath(filePath);

    return {
      text: extracted.text,
      pages: extracted.numPages,
      lowText: extracted.lowText,
    };
  }

  async extractTextFromPdfBuffer(buffer: Buffer) {
    const extracted = await this.pdfTextService.extractFromMemory(buffer);

    return {
      text: extracted.text,
      pages: extracted.numPages,
      lowText: extracted.lowText,
    };
  }

  async chatWithAssistant(params: {
    serviceOrderId: string;
    question: string;
    device?: string;
    brand?: string;
    model?: string;
    defect?: string;
    pdfBuffer?: Buffer;
  }) {
    const serviceOrderId = Number(params.serviceOrderId);
    if (!Number.isInteger(serviceOrderId) || serviceOrderId <= 0) {
      throw new BadRequestException('Invalid serviceOrderId');
    }
    const question = String(params.question || '').trim();
    if (!question) {
      throw new BadRequestException('question is required');
    }

    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id: serviceOrderId },
      relations: ['device', 'deviceBrand'],
    });
    if (!serviceOrder) {
      throw new NotFoundException(`service_order ${serviceOrderId} not found`);
    }

    let manualText = '';
    let lowText = false;
    if (params.pdfBuffer) {
      const extracted = await this.pdfTextService.extractFromMemory(params.pdfBuffer);
      manualText = extracted.text;
      lowText = extracted.lowText;
    }

    const equipment = {
      device: params.device?.trim() || serviceOrder.device?.name || 'Unknown device',
      brand: params.brand?.trim() || serviceOrder.deviceBrand?.name || '',
      model: params.model?.trim() || serviceOrder.model || '',
      defect: params.defect?.trim() || serviceOrder.defectivePart || '',
    };

    const answer = await this.llmService.generateChatAnswer({
      equipment,
      question,
      manualText: manualText || undefined,
      lowText,
    });

    const userMessage = this.chatMessageRepository.create();
    userMessage.serviceOrderId = serviceOrderId;
    userMessage.content = `USER: ${question}`;
    userMessage.meta = {
      engineUsed: 'llm',
      mode: 'chat',
      hasManual: Boolean(params.pdfBuffer),
    };
    await this.chatMessageRepository.save(userMessage);

    const assistantMessage = this.chatMessageRepository.create();
    assistantMessage.serviceOrderId = serviceOrderId;
    assistantMessage.content = answer;
    assistantMessage.meta = {
      engineUsed: 'llm',
      mode: 'chat',
      hasManual: Boolean(params.pdfBuffer),
      lowText,
    };
    await this.chatMessageRepository.save(assistantMessage);

    return {
      answer,
      engine: 'llm' as const,
      serviceOrderId: String(serviceOrderId),
      lowText,
    };
  }
}
