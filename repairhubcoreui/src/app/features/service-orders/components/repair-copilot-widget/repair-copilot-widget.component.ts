import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ChatHistoryMessage,
  RepairAssistantChatService,
} from '../../../../shared/services/repair-assistant-chat.service';
import {
  DiagnosticNextResponse,
  RepairAssistantDiagnosticService,
} from '../../../../shared/services/repair-assistant-diagnostic.service';
import {
  RepairAssistantChatRequest,
  RepairAssistantLlmChatService,
} from '../../../../shared/services/repair-assistant-llm-chat.service';

type CopilotMode = 'recommendation' | 'diagnostic';

interface LocalChatMessage {
  id: string;
  role: 'serviceOrder' | 'assistant';
  text: string;
  createdAt: Date;
  status: 'streaming' | 'final' | 'error';
}

@Component({
  selector: 'app-repair-copilot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-copilot-widget.component.html',
  styleUrl: './repair-copilot-widget.component.css',
})
export class RepairCopilotWidgetComponent implements OnInit, OnChanges, OnDestroy {
  private readonly llmChatService = inject(RepairAssistantLlmChatService);
  private readonly chatService = inject(RepairAssistantChatService);
  private readonly diagnosticService = inject(RepairAssistantDiagnosticService);

  @Input() serviceOrderId: number | null = null;
  @Input() device?: string | null;
  @Input() brand?: string | null;
  @Input() model?: string | null;
  @Input() defect?: string | null;

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  mode: CopilotMode = 'recommendation';
  isOpen = false;
  isStreaming = false;
  isAnalyzing = false;
  isDiagnosticLoading = false;
  isLoadingHistory = false;
  isUploadingPdf = false;
  showScrollToBottom = false;
  streamErrorMessage: string | null = null;
  uploadInfoMessage: string | null = null;
  engineUsed: 'llm' | 'unknown' = 'unknown';

  draftMessage = '';
  messages: LocalChatMessage[] = [];
  selectedPdfFile: File | null = null;
  currentDiagnostic: DiagnosticNextResponse | null = null;

  private requestSubscription?: Subscription;
  private loadedHistoryForServiceOrderId: number | null = null;
  private lastRequest: RepairAssistantChatRequest | null = null;

  ngOnInit(): void {
    // no-op
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceOrderId']) {
      this.loadedHistoryForServiceOrderId = null;
      this.messages = [];
      this.currentDiagnostic = null;
      this.selectedPdfFile = null;
    }
  }

  ngOnDestroy(): void {
    this.cancelActiveRequest();
  }

  get isDisabled(): boolean {
    return !this.serviceOrderId;
  }

  get isProcessing(): boolean {
    return this.isStreaming || this.isDiagnosticLoading;
  }

  get canSend(): boolean {
    if (this.isDisabled || this.isProcessing) return false;
    return this.draftMessage.trim().length > 0;
  }

  get canRetry(): boolean {
    return !this.isProcessing && !!this.lastRequest;
  }

  get contextDevice(): string {
    return this.device?.trim() || 'N/A';
  }

  get contextBrand(): string {
    return this.brand?.trim() || 'N/A';
  }

  get contextModel(): string {
    return this.model?.trim() || 'N/A';
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadChatHistoryIfNeeded();
      if (this.mode === 'diagnostic' && !this.currentDiagnostic) {
        this.requestDiagnosticNext();
      }
      setTimeout(() => {
        this.scrollToBottom(true);
        this.messageInput?.nativeElement.focus();
      }, 0);
    }
  }

  setMode(mode: CopilotMode): void {
    this.mode = mode;
    this.streamErrorMessage = null;

    if (mode === 'diagnostic' && this.isOpen && !this.currentDiagnostic) {
      this.requestDiagnosticNext();
    }
  }

  minimize(): void {
    this.isOpen = false;
  }

  closePanel(): void {
    this.isOpen = false;
    this.cancelActiveRequest();
  }

  clearLocalChat(): void {
    this.messages = [];
    this.currentDiagnostic = null;
    this.streamErrorMessage = null;
    this.showScrollToBottom = false;
  }

  retryLastRequest(): void {
    if (!this.lastRequest || this.isProcessing) return;

    const assistantMessage: LocalChatMessage = {
      id: this.makeId(),
      role: 'assistant',
      text: '',
      createdAt: new Date(),
      status: 'streaming',
    };

    this.messages.push(assistantMessage);
    this.scrollToBottom(true);
    this.startLlmRequest(this.lastRequest, assistantMessage.id);
  }

  submitDiagnosticPreset(answer: 'yes' | 'no'): void {
    if (this.mode !== 'diagnostic' || this.isProcessing) return;

    this.messages.push({
      id: this.makeId(),
      role: 'serviceOrder',
      text: answer,
      createdAt: new Date(),
      status: 'final',
    });
    this.scrollToBottom(true);
    this.requestDiagnosticNext(answer);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.minimize();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResizeTextarea(): void {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }

  onMessagesScroll(): void {
    const container = this.messagesContainer?.nativeElement;
    if (!container) return;

    const threshold = 80;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    this.showScrollToBottom = distanceToBottom > threshold;
  }

  scrollToBottom(force = false): void {
    const container = this.messagesContainer?.nativeElement;
    if (!container) return;

    if (force || !this.showScrollToBottom) {
      container.scrollTop = container.scrollHeight;
      this.showScrollToBottom = false;
    }
  }

  openFilePicker(): void {
    if (this.isDisabled || this.isProcessing) return;
    this.fileInput?.nativeElement.click();
  }

  removeSelectedPdf(): void {
    this.selectedPdfFile = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fileList = input.files;
    if (!fileList || !fileList.length || this.isDisabled) {
      return;
    }

    const file = fileList[0];
    const name = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
    const underMaxSize = file.size <= 15 * 1024 * 1024;
    if (!isPdf || !underMaxSize) {
      this.streamErrorMessage = 'Only one PDF file up to 15MB is allowed.';
      input.value = '';
      return;
    }

    this.selectedPdfFile = file;
    this.streamErrorMessage = null;
    this.uploadInfoMessage = `Selected: ${file.name}`;
    input.value = '';
  }

  sendMessage(): void {
    if (this.mode === 'diagnostic') {
      this.sendDiagnosticMessage();
      return;
    }
    this.sendRecommendationMessage();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private sendRecommendationMessage(): void {
    if (!this.canSend || this.isDisabled) return;

    const userText = this.draftMessage.trim();
    this.draftMessage = '';
    this.autoResizeTextarea();

    const userMessage: LocalChatMessage = {
      id: this.makeId(),
      role: 'serviceOrder',
      text: userText,
      createdAt: new Date(),
      status: 'final',
    };

    const assistantMessage: LocalChatMessage = {
      id: this.makeId(),
      role: 'assistant',
      text: '',
      createdAt: new Date(),
      status: 'streaming',
    };

    this.messages.push(userMessage, assistantMessage);
    this.scrollToBottom(true);

    const request: RepairAssistantChatRequest = {
      serviceOrderId: String(this.serviceOrderId),
      question: userText,
      device: this.device?.trim() || undefined,
      brand: this.brand?.trim() || undefined,
      model: this.model?.trim() || undefined,
      defect: this.defect?.trim() || undefined,
    };

    this.lastRequest = request;
    this.startLlmRequest(request, assistantMessage.id);
  }

  private startLlmRequest(request: RepairAssistantChatRequest, assistantMessageId: string): void {
    this.cancelActiveRequest();
    this.isStreaming = true;
    this.isAnalyzing = true;
    this.streamErrorMessage = null;
    this.engineUsed = 'unknown';
    this.isUploadingPdf = Boolean(this.selectedPdfFile);

    this.requestSubscription = this.llmChatService
      .ask(request, this.selectedPdfFile ?? undefined)
      .subscribe({
        next: (response) => {
          this.engineUsed = response.engine;
          const assistant = this.findAssistantMessage(assistantMessageId);
          if (!assistant) return;
          assistant.text = response.answer;
          assistant.status = 'final';
          if (response.lowText) {
            assistant.text += '\n\nNote: The uploaded PDF appears to have low text content.';
          }
          this.scrollToBottom(true);
        },
        error: (error) => {
          this.streamErrorMessage = error?.error?.message || error?.message || 'Assistant request failed.';
          this.markAssistantAsError(
            assistantMessageId,
            this.streamErrorMessage ?? 'Assistant request failed.',
          );
        },
        complete: () => {
          this.finishStreaming();
          this.isUploadingPdf = false;
        },
      });
  }

  private sendDiagnosticMessage(): void {
    if (!this.canSend || this.isDisabled) return;

    const answer = this.draftMessage.trim();
    this.draftMessage = '';
    this.autoResizeTextarea();

    this.messages.push({
      id: this.makeId(),
      role: 'serviceOrder',
      text: answer,
      createdAt: new Date(),
      status: 'final',
    });
    this.scrollToBottom(true);

    this.requestDiagnosticNext(answer);
  }

  private requestDiagnosticNext(answer?: string): void {
    if (this.isDisabled || !this.contextDevice || this.contextDevice === 'N/A') {
      this.streamErrorMessage = 'Device context is required for diagnostic mode.';
      return;
    }

    this.isDiagnosticLoading = true;
    this.isAnalyzing = true;
    this.streamErrorMessage = null;

    this.diagnosticService
      .next({
        serviceOrderId: String(this.serviceOrderId),
        device: this.contextDevice,
        brand: this.brand?.trim() || undefined,
        model: this.model?.trim() || undefined,
        defect: this.defect?.trim() || undefined,
        answer,
      })
      .subscribe({
        next: (response) => {
          this.currentDiagnostic = response;
          this.messages.push({
            id: this.makeId(),
            role: 'assistant',
            text: this.formatDiagnosticResponse(response),
            createdAt: new Date(),
            status: 'final',
          });
          this.scrollToBottom(true);
        },
        error: (error) => {
          this.streamErrorMessage = error?.error?.message || 'Diagnostic flow failed.';
        },
        complete: () => {
          this.isDiagnosticLoading = false;
          this.isAnalyzing = false;
        },
      });
  }

  private formatDiagnosticResponse(response: DiagnosticNextResponse): string {
    const lines: string[] = [response.question];

    if (response.currentChecklist?.length) {
      lines.push('');
      lines.push('Checklist:');
      for (const item of response.currentChecklist) {
        lines.push(`- ${item}`);
      }
    }

    if (response.hint) {
      lines.push('');
      lines.push(`Hint: ${response.hint}`);
    }

    lines.push('');
    lines.push(`Expected answer: ${response.expectedAnswerType}`);
    lines.push(`Confidence: ${response.confidence}`);

    return lines.join('\n');
  }

  private loadChatHistoryIfNeeded(force = false): void {
    if (!this.serviceOrderId || this.isStreaming) return;
    if (!force && this.loadedHistoryForServiceOrderId === this.serviceOrderId) return;

    this.isLoadingHistory = true;
    this.chatService.getHistory(String(this.serviceOrderId)).subscribe({
      next: (history) => {
        this.messages = history
          .map((entry) => this.toLocalMessage(entry))
          .filter((message): message is LocalChatMessage => !!message);
        this.loadedHistoryForServiceOrderId = this.serviceOrderId;
        setTimeout(() => this.scrollToBottom(true), 0);
      },
      error: () => {
        this.streamErrorMessage = this.streamErrorMessage || 'Could not load chat history.';
      },
      complete: () => {
        this.isLoadingHistory = false;
      },
    });
  }

  private toLocalMessage(entry: ChatHistoryMessage): LocalChatMessage | null {
    const content = String(entry.content || '');
    const createdAt = entry.createdAt ? new Date(entry.createdAt) : new Date();

    if (content.startsWith('USER:')) {
      return {
        id: `history-${entry.id}`,
        role: 'serviceOrder',
        text: content.replace(/^USER:\s*/, ''),
        createdAt,
        status: 'final',
      };
    }

    if (content.startsWith('USER_DIAG:')) {
      return {
        id: `history-${entry.id}`,
        role: 'serviceOrder',
        text: content.replace(/^USER_DIAG:\s*/, ''),
        createdAt,
        status: 'final',
      };
    }

    if (content.startsWith('ASSISTANT_DIAG_JSON:')) {
      const rawJson = content.slice('ASSISTANT_DIAG_JSON:'.length).trim();
      const diagnostic = this.tryParseDiagnostic(rawJson);
      return {
        id: `history-${entry.id}`,
        role: 'assistant',
        text: diagnostic ? this.formatDiagnosticResponse(diagnostic) : rawJson,
        createdAt,
        status: 'final',
      };
    }

    if (entry.meta && typeof entry.meta === 'object' && 'engineUsed' in entry.meta) {
      return {
        id: `history-${entry.id}`,
        role: 'assistant',
        text: content,
        createdAt,
        status: 'final',
      };
    }

    return {
      id: `history-${entry.id}`,
      role: 'serviceOrder',
      text: content,
      createdAt,
      status: 'final',
    };
  }

  private tryParseDiagnostic(raw: string): DiagnosticNextResponse | null {
    try {
      const parsed = JSON.parse(raw) as Partial<DiagnosticNextResponse>;
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.question || !parsed.expectedAnswerType) return null;
      return parsed as DiagnosticNextResponse;
    } catch {
      return null;
    }
  }

  private findAssistantMessage(id: string): LocalChatMessage | undefined {
    return this.messages.find((message) => message.id === id && message.role === 'assistant');
  }

  private markAssistantAsError(assistantMessageId: string, errorMessage: string): void {
    const assistant = this.findAssistantMessage(assistantMessageId);
    if (!assistant) return;

    assistant.status = 'error';
    if (!assistant.text.trim()) {
      assistant.text = errorMessage;
    }
  }

  private finishStreaming(): void {
    this.isStreaming = false;
    this.isAnalyzing = false;
  }

  private cancelActiveRequest(): void {
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
      this.requestSubscription = undefined;
    }
    this.isStreaming = false;
    this.isAnalyzing = false;
    this.isUploadingPdf = false;
  }

  private makeId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
