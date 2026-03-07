import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AnalyzeManualDto } from './dto/analyze-manual.dto';
import { PdfTextService } from './pdf-text.service';
import {
  ManualFragment,
  ManualSection,
  RankedFragment,
  SimpleRanker,
} from './simple-ranker.service';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { DocumentEntity } from '../documents/entities/document.entity';
import { ChatMessage } from '../chat_messages/entities/chat_message.entity';

type AnalyzeManualResponse = {
  probableDiagnosis: string;
  recommendedProcedure: string[];
  testsToPerform: string[];
  requiredTools: string[];
  risksAndPrecautions: string[];
  relatedManualPages: Array<{ documentId: string; page: number | null; excerpt: string }>;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
};

@Injectable()
export class ManualAnalyzerService {
  constructor(
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly pdfTextService: PdfTextService,
    private readonly simpleRanker: SimpleRanker,
  ) {}

  private detectSection(text: string): ManualSection {
    const normalized = text.toLowerCase();
    if (/(troubleshoot|diagnos|fault|fails|symptom|problem)/i.test(normalized)) {
      return 'troubleshooting';
    }
    if (/(error\s*code|code\s*e\d+|alarm|beep code)/i.test(normalized)) {
      return 'error_codes';
    }
    if (/(disassembl|tear[\s-]*down|remove cover|open chassis)/i.test(normalized)) {
      return 'disassembly';
    }
    if (/(repair procedure|replace|reassembly|install|step\s*\d+)/i.test(normalized)) {
      return 'repair_procedures';
    }
    return 'general';
  }

  private createFragments(documentId: number, pages: Array<{ page: number | null; text: string }>) {
    const fragments: ManualFragment[] = [];
    for (const page of pages) {
      const chunks = page.text
        .split(/(?<=[.!?])\s+|\n{2,}/)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length >= 40)
        .slice(0, 30);

      for (const chunk of chunks) {
        fragments.push({
          documentId,
          page: page.page,
          text: chunk,
          section: this.detectSection(chunk),
        });
      }
    }
    return fragments;
  }

  private pickList(ranked: RankedFragment[], predicate: (section: ManualSection) => boolean) {
    return ranked
      .filter((f) => predicate(f.section))
      .slice(0, 4)
      .map((f) => f.text.slice(0, 220));
  }

  private summarizeDiagnosis(
    ranked: RankedFragment[],
    context: { defect: string; device?: string; brand?: string; model?: string },
  ) {
    const top = ranked[0];
    if (!top) return `No conclusive diagnosis was found for "${context.defect}".`;

    const surface = [context.brand, context.model, context.device].filter(Boolean).join(' ');
    return `Possible cause for ${surface || 'the device'}: ${top.text.slice(0, 180)}`;
  }

  private inferTools(ranked: RankedFragment[]) {
    const keywords = ['screwdriver', 'torx', 'multimeter', 'solder', 'tweezers', 'esd', 'spudger'];
    const found = new Set<string>();
    const corpus = ranked
      .slice(0, 10)
      .map((r) => r.text.toLowerCase())
      .join(' ');

    for (const key of keywords) {
      if (corpus.includes(key)) found.add(key);
    }

    if (found.size === 0) return ['Review tools required by the original service manual'];
    return Array.from(found).map((t) => `Confirm availability of ${t}`);
  }

  private inferRisks(ranked: RankedFragment[]) {
    const warnings = ranked
      .filter((r) => /warning|caution|high voltage|disconnect power|esd/i.test(r.text))
      .slice(0, 4)
      .map((r) => r.text.slice(0, 180));

    if (warnings.length > 0) return warnings;
    return ['Disconnect power and use ESD protection before disassembly.'];
  }

  private confidenceFrom(ranked: RankedFragment[], lowTextCount: number, totalDocs: number) {
    if (ranked.length === 0) return 'low' as const;
    const top = ranked[0].score;
    if (lowTextCount > 0 && lowTextCount >= totalDocs) return 'low' as const;
    if (top >= 15) return 'high' as const;
    if (top >= 8) return 'medium' as const;
    return 'low' as const;
  }

  private async saveChat(serviceOrderId: number, defect: string, result: AnalyzeManualResponse) {
    const userMessage = this.chatMessageRepository.create({
      serviceOrderId,
      content: `USER: ${defect}`,
    });
    const assistantMessage = this.chatMessageRepository.create({
      serviceOrderId,
      content: `ASSISTANT_JSON: ${JSON.stringify(result)}`,
    });
    await this.chatMessageRepository.save([userMessage, assistantMessage]);
  }

  async analyzeManual(dto: AnalyzeManualDto): Promise<AnalyzeManualResponse> {
    const serviceOrderId = Number(dto.serviceOrderId);
    if (!Number.isInteger(serviceOrderId) || serviceOrderId <= 0) {
      throw new BadRequestException('Invalid serviceOrderId');
    }

    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id: serviceOrderId },
      relations: ['device', 'deviceBrand'],
    });

    if (!serviceOrder) {
      throw new NotFoundException(`service_order ${serviceOrderId} not found`);
    }

    const context = {
      device: dto.device || serviceOrder.device?.name || undefined,
      brand: dto.brand || serviceOrder.deviceBrand?.name || undefined,
      model: dto.model || serviceOrder.model || undefined,
      defect: dto.defectivePart || serviceOrder.defectivePart || '',
    };

    if (!context.defect) {
      throw new BadRequestException(
        'defectivePart was not provided and service_order has no defectivePart',
      );
    }

    let documents: DocumentEntity[] = [];
    if (dto.documentIds?.length) {
      const ids = dto.documentIds.map((id) => Number(id)).filter((id) => Number.isInteger(id));
      if (!ids.length) throw new BadRequestException('Invalid documentIds');
      documents = await this.documentRepository.find({ where: { id: In(ids) } });
    } else {
      documents = await this.documentRepository.find({ where: { serviceOrderId } });
    }

    if (!documents.length) {
      throw new NotFoundException('No documents available to analyze');
    }

    const allFragments: ManualFragment[] = [];
    const notes: string[] = [];
    const lowTextDocs: number[] = [];

    for (const document of documents) {
      const extracted = await this.pdfTextService.extractFromPath(document.storagePath);
      if (extracted.lowText) {
        lowTextDocs.push(document.id);
        notes.push(
          `Document ${document.id} (${document.filename}) appears scanned or has low text content (low_text).`,
        );
      }
      const docFragments = this.createFragments(document.id, extracted.pages);
      allFragments.push(...docFragments);
    }

    const ranked = this.simpleRanker.rankFragments(allFragments, context.defect).slice(0, 20);

    const response: AnalyzeManualResponse = {
      probableDiagnosis: this.summarizeDiagnosis(ranked, context),
      recommendedProcedure: this.pickList(
        ranked,
        (s) => s === 'repair_procedures' || s === 'disassembly',
      ),
      testsToPerform: this.pickList(
        ranked,
        (s) => s === 'troubleshooting' || s === 'error_codes',
      ),
      requiredTools: this.inferTools(ranked),
      risksAndPrecautions: this.inferRisks(ranked),
      relatedManualPages: ranked.slice(0, 6).map((r) => ({
        documentId: String(r.documentId),
        page: r.page ?? null,
        excerpt: r.text.slice(0, 280),
      })),
      confidence: this.confidenceFrom(ranked, lowTextDocs.length, documents.length),
      notes,
    };

    if (!response.recommendedProcedure.length) {
      response.recommendedProcedure = ['No clear steps were identified; review the full manual.'];
    }
    if (!response.testsToPerform.length) {
      response.testsToPerform = ['Check power, continuity, and error codes for the device.'];
    }
    if (!response.relatedManualPages.length) {
      response.relatedManualPages = documents.slice(0, 1).map((d) => ({
        documentId: String(d.id),
        page: null,
        excerpt: 'No relevant fragments could be isolated automatically.',
      }));
    }
    if (lowTextDocs.length > 0) {
      response.notes.push(
        'Warning: one or more PDFs appear scanned and text extraction may be incomplete.',
      );
    }

    await this.saveChat(serviceOrderId, context.defect, response);
    return response;
  }
}
