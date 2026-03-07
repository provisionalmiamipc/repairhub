import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairCopilotWidgetComponent } from './components/repair-copilot-widget/repair-copilot-widget.component';
import { ServiceOrdersFormModernComponent } from './service-orders-form-modern.component';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { CustomersService } from '../../shared/services/customers.service';
import { DevicesService } from '../../shared/services/devices.service';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { EmployeesService } from '../../shared/services/employees.service';
import { SONotesService } from '../../shared/services/so-notes.service';
import { SODiagnosticService } from '../../shared/services/so-diagnostic.service';
import { SOItemsService } from '../../shared/services/so-items.service';
import { RepairStatusService } from '../../shared/services/repair-status.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../shared/services/auth.service';
import { ReceivedPartsService } from '../received-parts/received-parts.service';
import { RepairAssistantChatService } from '../../shared/services/repair-assistant-chat.service';
import { RepairAssistantDiagnosticService } from '../../shared/services/repair-assistant-diagnostic.service';
import { RepairAssistantLlmChatService } from '../../shared/services/repair-assistant-llm-chat.service';

function createCrudStub() {
  return {
    getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
    getById: jasmine.createSpy('getById').and.returnValue(of({})),
    create: jasmine.createSpy('create').and.returnValue(of({})),
    update: jasmine.createSpy('update').and.returnValue(of({})),
    delete: jasmine.createSpy('delete').and.returnValue(of({})),
  };
}

describe('ServiceOrdersFormModernComponent + Widget', () => {
  beforeEach(async () => {
    const authStub = {
      getUserType: jasmine.createSpy('getUserType').and.returnValue('user'),
      getCurrentEmployee: jasmine.createSpy('getCurrentEmployee').and.returnValue(null),
      isExpert: jasmine.createSpy('isExpert').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [ServiceOrdersFormModernComponent],
      providers: [
        { provide: ServiceOrdersService, useValue: createCrudStub() },
        { provide: CentersService, useValue: createCrudStub() },
        { provide: StoresService, useValue: createCrudStub() },
        { provide: CustomersService, useValue: createCrudStub() },
        { provide: DevicesService, useValue: createCrudStub() },
        { provide: DeviceBrandsService, useValue: createCrudStub() },
        { provide: PaymentTypesService, useValue: createCrudStub() },
        { provide: EmployeesService, useValue: createCrudStub() },
        { provide: SONotesService, useValue: createCrudStub() },
        { provide: SODiagnosticService, useValue: createCrudStub() },
        { provide: SOItemsService, useValue: createCrudStub() },
        { provide: RepairStatusService, useValue: createCrudStub() },
        { provide: ReceivedPartsService, useValue: createCrudStub() },
        { provide: ToastService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } },
        { provide: RepairAssistantLlmChatService, useValue: { ask: () => of({ answer: 'ok', engine: 'llm', serviceOrderId: '1' }) } },
        { provide: RepairAssistantChatService, useValue: { getHistory: () => of([]) } },
        { provide: RepairAssistantDiagnosticService, useValue: { next: () => of({ question: 'Q', expectedAnswerType: 'text', confidence: 'low' }) } },
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    })
      .overrideComponent(ServiceOrdersFormModernComponent, {
        set: {
          template: `
            <app-repair-copilot-widget
              [serviceOrderId]="currentServiceOrderId()"
              [device]="getCopilotDeviceName()"
              [brand]="getCopilotBrandName()"
              [model]="getCopilotModel()"
              [defect]="getCopilotDefect()"
            ></app-repair-copilot-widget>
          `,
        },
      })
      .compileComponents();
  });

  it('pasa serviceOrderId y contexto al widget', () => {
    const fixture = TestBed.createComponent(ServiceOrdersFormModernComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    component.currentServiceOrderId.set(222);
    component.devices.set([{ id: 9, name: 'Camera' }]);
    component.deviceBrands.set([{ id: 5, name: 'Canon' }]);
    component.serviceOrderForm.patchValue({
      deviceId: 9,
      deviceBrandId: 5,
      model: 'R6',
      defectivePart: 'No enciende',
    });

    fixture.detectChanges();

    const widgetDe = fixture.debugElement.query(By.directive(RepairCopilotWidgetComponent));
    const widget = widgetDe.componentInstance as RepairCopilotWidgetComponent;

    expect(widget.serviceOrderId).toBe(222);
    expect(widget.device).toBe('Camera');
    expect(widget.brand).toBe('Canon');
    expect(widget.model).toBe('R6');
    expect(widget.defect).toBe('No enciende');
  });
});
