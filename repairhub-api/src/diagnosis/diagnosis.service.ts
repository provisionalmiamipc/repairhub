import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticNextDto } from './dto/diagnostic-next.dto';
import { DiagnosisSession } from './entities/diagnosis_session.entity';
import { ChatMessage } from '../chat_messages/entities/chat_message.entity';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { DEFAULT_CATEGORY, DIAGNOSIS_RULE_TREES, RuleNode, RuleTree } from './diagnosis-rules';

type DiagnosticResponse = {
  question: string;
  expectedAnswerType: 'yesno' | 'number' | 'text';
  nextIfYes?: string;
  nextIfNo?: string;
  hint?: string;
  currentChecklist?: string[];
  confidence: 'medium' | 'low';
};

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(DiagnosisSession)
    private readonly diagnosisSessionRepository: Repository<DiagnosisSession>,
    @InjectRepository(ServiceOrder)
    private readonly serviceOrderRepository: Repository<ServiceOrder>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  pickCategory(defect?: string): string {
    const normalized = (defect ?? '').toLowerCase();
    for (const tree of DIAGNOSIS_RULE_TREES) {
      if (tree.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
        return tree.category;
      }
    }
    return DEFAULT_CATEGORY;
  }

  getTreeByCategory(category: string): RuleTree {
    return (
      DIAGNOSIS_RULE_TREES.find((tree) => tree.category === category) ??
      DIAGNOSIS_RULE_TREES.find((tree) => tree.category === DEFAULT_CATEGORY)!
    );
  }

  getNode(tree: RuleTree, nodeId: string): RuleNode {
    const node = tree.nodes[nodeId];
    if (!node) throw new BadRequestException(`Diagnosis node not found: ${nodeId}`);
    return node;
  }

  private toResponse(node: RuleNode): DiagnosticResponse {
    return {
      question: node.question,
      expectedAnswerType: node.expectedAnswerType,
      nextIfYes: node.yes,
      nextIfNo: node.no,
      hint: node.hint,
      currentChecklist: node.checklist,
      confidence: node.confidence ?? 'low',
    };
  }

  private normalizeAnswer(answer?: string) {
    if (!answer) return undefined;
    const normalized = answer.trim().toLowerCase();
    if (['yes', 'y', 'si', 'sí', 'true', '1'].includes(normalized)) return 'yes';
    if (['no', 'n', 'false', '0'].includes(normalized)) return 'no';
    return normalized;
  }

  private getNextStep(node: RuleNode, normalizedAnswer?: string): string {
    if (!normalizedAnswer) return node.id;
    if (node.expectedAnswerType === 'yesno') {
      if (normalizedAnswer === 'yes') return node.yes ?? node.id;
      if (normalizedAnswer === 'no') return node.no ?? node.id;
      throw new BadRequestException('Answer must be yes/no for this question');
    }
    return node.next ?? node.yes ?? node.no ?? node.id;
  }

  private async logExchange(serviceOrderId: number, answer: string | undefined, response: DiagnosticResponse) {
    const userPayload = answer ? `USER_DIAG: ${answer}` : 'USER_DIAG: [session_start]';
    const userMessage = this.chatMessageRepository.create({
      serviceOrderId,
      content: userPayload,
    });
    const assistantMessage = this.chatMessageRepository.create({
      serviceOrderId,
      content: `ASSISTANT_DIAG_JSON: ${JSON.stringify(response)}`,
    });
    await this.chatMessageRepository.save([userMessage, assistantMessage]);
  }

  async next(dto: DiagnosticNextDto): Promise<DiagnosticResponse> {
    const serviceOrderId = Number(dto.serviceOrderId);
    if (!Number.isInteger(serviceOrderId) || serviceOrderId <= 0) {
      throw new BadRequestException('Invalid serviceOrderId');
    }

    const serviceOrder = await this.serviceOrderRepository.findOne({
      where: { id: serviceOrderId },
      relations: ['device', 'deviceBrand'],
    });
    if (!serviceOrder) throw new NotFoundException(`service_order ${serviceOrderId} not found`);

    const defect = dto.defect || serviceOrder.defectivePart || 'no power';

    let session = await this.diagnosisSessionRepository.findOne({
      where: { serviceOrderId },
      order: { updatedAt: 'DESC' },
    });

    if (!session) {
      const category = this.pickCategory(defect);
      const tree = this.getTreeByCategory(category);
      const initialNode = this.getNode(tree, tree.start);

      session = this.diagnosisSessionRepository.create({
        serviceOrderId,
        state: {
          category,
          currentStep: tree.start,
          answers: {},
          lastQuestion: initialNode.question,
          path: [tree.start],
          defect,
          device: dto.device,
          brand: dto.brand || serviceOrder.deviceBrand?.name,
          model: dto.model || serviceOrder.model,
        },
      });

      session = await this.diagnosisSessionRepository.save(session);
      const response = this.toResponse(initialNode);
      await this.logExchange(serviceOrderId, undefined, response);
      return response;
    }

    const category = session.state.category || this.pickCategory(defect);
    const tree = this.getTreeByCategory(category);
    const currentNode = this.getNode(tree, session.state.currentStep);
    const normalizedAnswer = this.normalizeAnswer(dto.answer);

    if (!normalizedAnswer) {
      const response = this.toResponse(currentNode);
      await this.logExchange(serviceOrderId, undefined, response);
      return response;
    }

    const nextStep = this.getNextStep(currentNode, normalizedAnswer);
    const nextNode = this.getNode(tree, nextStep);

    session.state = {
      ...session.state,
      currentStep: nextNode.id,
      lastQuestion: nextNode.question,
      answers: {
        ...(session.state.answers ?? {}),
        [currentNode.id]: normalizedAnswer,
      },
      path: [...(session.state.path ?? []), nextNode.id],
    };
    await this.diagnosisSessionRepository.save(session);

    const response = this.toResponse(nextNode);
    await this.logExchange(serviceOrderId, normalizedAnswer, response);
    return response;
  }
}
