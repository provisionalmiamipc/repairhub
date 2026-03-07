import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RepairCopilotWidgetComponent } from './repair-copilot-widget.component';
import {
  RepairAssistantChatRequest,
  RepairAssistantLlmChatService,
} from '../../../../shared/services/repair-assistant-llm-chat.service';
import {
  ChatHistoryMessage,
  RepairAssistantChatService,
} from '../../../../shared/services/repair-assistant-chat.service';
import {
  DiagnosticNextResponse,
  RepairAssistantDiagnosticService,
} from '../../../../shared/services/repair-assistant-diagnostic.service';

class MockRepairAssistantLlmChatService {
  ask = jasmine.createSpy('ask').and.callFake((req: RepairAssistantChatRequest) =>
    of({
      answer: `LLM answer for: ${req.question}`,
      engine: 'llm' as const,
      serviceOrderId: req.serviceOrderId,
    }),
  );
}

class MockRepairAssistantChatService {
  getHistory = jasmine.createSpy('getHistory').and.returnValue(of([] as ChatHistoryMessage[]));
}

class MockRepairAssistantDiagnosticService {
  next = jasmine.createSpy('next').and.callFake(() => {
    const response: DiagnosticNextResponse = {
      question: 'Is the power LED on?',
      expectedAnswerType: 'yesno',
      confidence: 'medium',
      hint: 'Check AC adapter first.',
      currentChecklist: ['Confirm outlet power'],
    };
    return of(response);
  });
}

describe('RepairCopilotWidgetComponent', () => {
  let component: RepairCopilotWidgetComponent;
  let fixture: ComponentFixture<RepairCopilotWidgetComponent>;
  let chatLlmService: MockRepairAssistantLlmChatService;
  let diagnosticService: MockRepairAssistantDiagnosticService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairCopilotWidgetComponent],
      providers: [
        { provide: RepairAssistantLlmChatService, useClass: MockRepairAssistantLlmChatService },
        { provide: RepairAssistantChatService, useClass: MockRepairAssistantChatService },
        { provide: RepairAssistantDiagnosticService, useClass: MockRepairAssistantDiagnosticService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RepairCopilotWidgetComponent);
    component = fixture.componentInstance;
    component.serviceOrderId = 101;
    component.device = 'Camera';
    component.brand = 'Canon';
    component.model = 'R6';
    component.isOpen = true;

    chatLlmService = TestBed.inject(
      RepairAssistantLlmChatService,
    ) as unknown as MockRepairAssistantLlmChatService;
    diagnosticService = TestBed.inject(
      RepairAssistantDiagnosticService,
    ) as unknown as MockRepairAssistantDiagnosticService;

    fixture.detectChanges();
  });

  it('renders user message when sending recommendation', () => {
    component.draftMessage = 'No power';
    component.sendMessage();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No power');
    expect(component.messages.some((msg) => msg.role === 'serviceOrder')).toBeTrue();
  });

  it('shows plain llm answer text', () => {
    component.draftMessage = 'Shutter stuck';
    component.sendMessage();
    fixture.detectChanges();

    expect(chatLlmService.ask).toHaveBeenCalled();
    const assistant = component.messages.find((msg) => msg.role === 'assistant');
    expect(assistant?.text).toContain('LLM answer for: Shutter stuck');
    expect(component.engineUsed).toBe('llm');
  });

  it('starts diagnostic mode and shows question response', () => {
    component.setMode('diagnostic');
    fixture.detectChanges();

    expect(diagnosticService.next).toHaveBeenCalled();
    expect(component.messages.some((msg) => msg.text.includes('Is the power LED on?'))).toBeTrue();
  });
});
