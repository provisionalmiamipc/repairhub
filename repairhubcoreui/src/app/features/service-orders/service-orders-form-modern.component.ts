import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { SONotes } from '../../shared/models/SONotes';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { SOItems } from '../../shared/models/SOItems';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { CustomersService } from '../../shared/services/customers.service';
import { Customers } from '../../shared/models/Customers';
import { DevicesService } from '../../shared/services/devices.service';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { EmployeesService } from '../../shared/services/employees.service';
import { AuthService } from '../../shared/services/auth.service';
import { SONotesService } from '../../shared/services/so-notes.service';
import { SODiagnosticService } from '../../shared/services/so-diagnostic.service';
import { SOItemsService } from '../../shared/services/so-items.service';
import { RepairStatusService } from '../../shared/services/repair-status.service';
import { ToastService } from '../../shared/services/toast.service';
import { DevicesFormComponent } from '../devices/devices-form.component';
import { DeviceBrandsFormComponent } from '../device-brands/device-brands-form.component';
import { PaymentTypesFormComponent } from '../payment-types/payment-types-form.component';
import { CustomerSearchComponent } from '../customers/customer-search.component';
import { CustomersFormComponent } from '../customers/customers-form.component';
import { SONotesFormComponent } from '../so-notes/so-notes-form.component';
import { SODiagnosticFormComponent } from '../so-diagnostic/so-diagnostic-form.component';
import { SOItemsFormComponent } from '../so-items/so-items-form.component';
import { RepairStatusFormComponent } from '../repair-status/repair-status-form.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-service-orders-form-modern',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DevicesFormComponent,
    DeviceBrandsFormComponent,
    PaymentTypesFormComponent,
    CustomerSearchComponent,
    CustomersFormComponent,
    SONotesFormComponent,
    SODiagnosticFormComponent,
    SOItemsFormComponent,
    RepairStatusFormComponent
  ],
  templateUrl: './service-orders-form-modern.component.html',
  //styleUrls: ['./service-orders-form-modern.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInFrom', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class ServiceOrdersFormModernComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private serviceOrdersService = inject(ServiceOrdersService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private customersService = inject(CustomersService);
  private devicesService = inject(DevicesService);
  private deviceBrandsService = inject(DeviceBrandsService);
  private paymentTypesService = inject(PaymentTypesService);
  private employeesService = inject(EmployeesService);
  private soNotesService = inject(SONotesService);
  private soDiagnosticService = inject(SODiagnosticService);
  private soItemsService = inject(SOItemsService);
  private repairStatusService = inject(RepairStatusService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Lógica de visibilidad y valores por tipo de usuario
  userType = signal<'user' | 'employee' | null>(null);
  isCenterAdmin = signal<boolean>(false);
  showCenterAndStoreFields = computed(() => this.userType() === 'user');
  showOnlyStoreField = computed(() => this.userType() === 'employee' && this.isCenterAdmin());
  hideLocationFields = computed(() => this.userType() === 'employee' && !this.isCenterAdmin());

  private initializeUserType() {
    const type = this.authService.getUserType();
    this.userType.set(type);
    const employee = this.authService.getCurrentEmployee();
    this.isCenterAdmin.set(!!employee?.isCenterAdmin);
  }

  private applyUserTypeRules() {
    // USER: campos visibles, sin cambios
    if (this.userType() === 'user') {
      this.serviceOrderForm.get('centerId')?.enable();
      this.serviceOrderForm.get('storeId')?.enable();
      this.serviceOrderForm.get('createdById')?.enable();
      return;
    }
    // EMPLOYEE: ocultar ambos campos y setear valores por defecto
    if (this.userType() === 'employee') {
      const employee = this.authService.getCurrentEmployee();
      const createdByControl = this.serviceOrderForm.get('createdById');
      // Solo setear createdById al crear (no en edición) y si está vacío
      if (!this.isEditMode() && employee?.id && !createdByControl?.value) {
        createdByControl?.setValue(employee.id);
      }
      createdByControl?.disable();
      if (employee?.isCenterAdmin) {
        // Solo mostrar storeId, centerId fijo
        this.serviceOrderForm.get('centerId')?.setValue(employee.centerId);
        this.selectedCenterId.set(employee.centerId ?? null);
        this.serviceOrderForm.get('centerId')?.disable();
        this.serviceOrderForm.get('storeId')?.enable();
        // Si el empleado tiene storeId, seleccionarlo por defecto
        if (employee.storeId) {
          this.serviceOrderForm.get('storeId')?.setValue(employee.storeId);
        }
      } else {
        // Ocultar ambos campos, setear ambos por defecto y deshabilitar
        this.serviceOrderForm.get('centerId')?.setValue(employee?.centerId ?? '');
        this.selectedCenterId.set(employee?.centerId ?? null);
        this.serviceOrderForm.get('centerId')?.disable();
        this.serviceOrderForm.get('storeId')?.setValue(employee?.storeId ?? '');
        this.serviceOrderForm.get('storeId')?.disable();
      }
    }
  }

  readonly formState = signal<FormState>({
    isLoading: false,
    isSaving: false,
    error: null,
    success: false,
    isEditMode: false
  });

  readonly currentServiceOrderId = signal<number | null>(null);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly customers = signal<any[]>([]);
  readonly devices = signal<any[]>([]);
  readonly deviceBrands = signal<any[]>([]);
  readonly paymentTypes = signal<any[]>([]);
  readonly employees = signal<any[]>([]);
  readonly selectedCenterId = signal<number | null>(null);
  readonly serviceOrder = signal<ServiceOrders | null>(null);

  // Related lists (edit mode)
  soNotes: SONotes[] = [];
  soDiagnostics: SODiagnostic[] = [];
  soItems: SOItems[] = [];
  repairStatuses: RepairStatus[] = [];

  // Modals
  showNoteModal = false;
  showDiagnosticModal = false;
  showItemModal = false;
  showStatusModal = false;
  showDeviceModal = false;
  showDeviceBrandModal = false;
  showPaymentTypeModal = false;
  showCustomerSearch = false;
  showCustomerModal = false;

  // Editing models
  editingNote: Partial<SONotes> | null = null;
  editingDiagnostic: Partial<SODiagnostic> | null = null;
  editingItem: Partial<SOItems> | null = null;
  editingStatus: Partial<RepairStatus> | null = null;
  editingDevice: Partial<any> | null = null;
  editingDeviceBrand: Partial<any> | null = null;
  editingPaymentType: Partial<any> | null = null;
  editingCustomer: Customers | null = null;

  serviceOrderForm!: FormGroup;
  private costChangeSubject = new Subject<void>();

  isLoading = computed(() => this.formState().isLoading);
  isSaving = computed(() => this.formState().isSaving);
  error = computed(() => this.formState().error);
  success = computed(() => this.formState().success);
  isEditMode = computed(() => this.formState().isEditMode);
  
  // Show steps only in create mode (not in edit mode)
  showSteps = computed(() => !this.isEditMode());

  // Computed filtered stores based on selected center
  filteredStores = computed(() => {
    const centerId = this.selectedCenterId();
    return centerId ? this.stores().filter(s => s.centerId === Number(centerId)) : [];
  });

  steps = [
    { id: 0, title: 'Centro y Tienda', description: 'Ubicación del servicio' },
    { id: 1, title: 'Cliente y Dispositivo', description: 'Información del cliente y equipo' },
    { id: 2, title: 'Detalles Técnicos', description: 'Especificaciones del equipo' },
    { id: 3, title: 'Costos', description: 'Precios y pagos' }
  ];

  currentStep = signal(0);

  ngOnInit(): void {
    this.initForm();
    this.initializeUserType();
    this.applyUserTypeRules();
    this.loadAllData();
    this.checkEditMode();
    this.setupCostCalculation();
    this.setupCenterChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.serviceOrderForm = this.fb.group({
      centerId: [{ value: '', disabled: false }, Validators.required],
      storeId: [{ value: '', disabled: false }, Validators.required],
      customerId: [null, Validators.required],
      deviceId: [null, Validators.required],
      deviceBrandId: [null, Validators.required],
      model: ['', Validators.required],
      serial: [''],
      defectivePart: [''],
      paymentTypeId: [null, Validators.required],
      assignedTechId: [null, Validators.required],
      createdById: [null, Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      repairCost: [0, [Validators.required, Validators.min(0)]],
      costdiscount: [0, [Validators.min(0)]],
      advancePayment: [0, [Validators.min(0)]],
      tax: [0, [Validators.min(0)]],
      totalCost: [0],
      lock: [false],
      noteReception: [''],
      cloused: [false],
      canceled: [false]
    });
  }

  private loadAllData(): void {
    this.centersService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.centers.set(data || []));

    this.storesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.stores.set(data || []));

    this.customersService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.customers.set(data || []));

    this.devicesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.devices.set(data || []));

    this.deviceBrandsService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.deviceBrands.set(data || []));

    this.paymentTypesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.paymentTypes.set(data || []));

    this.employeesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.employees.set(data || []));
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentServiceOrderId.set(parseInt(id, 10));
      this.formState.update(s => ({ ...s, isEditMode: true, isLoading: true }));
      this.loadServiceOrder(parseInt(id, 10));
    }
  }

  private loadServiceOrder(id: number): void {
    this.serviceOrdersService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.serviceOrderForm.patchValue(order);
          this.serviceOrder.set(order);
          this.lockFormIfFinalized();
          // Initialize selectedCenterId signal after patching form
          const centerId = this.serviceOrderForm.get('centerId')?.value;
          if (centerId) {
            this.selectedCenterId.set(centerId);
          }
          this.loadRelatedCollections();
          this.formState.update(s => ({ ...s, isLoading: false }));
        },
        error: (err) => {
          this.formState.update(s => ({
            ...s,
            isLoading: false,
            error: err?.error?.message || 'Error cargando la orden'
          }));
        }
      });
  }

  private lockFormIfFinalized(): void {
    if (this.isOrderFinalized()) {
      this.serviceOrderForm.disable({ emitEvent: false });
    }
  }

  isOrderFinalized(): boolean {
    return !!this.serviceOrderForm.get('cloused')?.value || !!this.serviceOrderForm.get('canceled')?.value;
  }

  completeOrder(): void {
    if (!this.currentServiceOrderId()) return;
    this.formState.update(s => ({ ...s, isSaving: true, error: null }));
    const payload = { ...this.serviceOrderForm.getRawValue(), cloused: true, canceled: false };
    this.serviceOrdersService.update(this.currentServiceOrderId()!, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Orden de servicio completada');
          this.router.navigate(['/service-orders']);
        },
        error: (err) => {
          this.formState.update(s => ({ ...s, isSaving: false, error: err?.error?.message || 'Error completando la orden' }));
        }
      });
  }

  cancelOrder(): void {
    if (!this.currentServiceOrderId()) return;
    this.formState.update(s => ({ ...s, isSaving: true, error: null }));
    const payload = { ...this.serviceOrderForm.getRawValue(), canceled: true, cloused: false };
    this.serviceOrdersService.update(this.currentServiceOrderId()!, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Orden de servicio cancelada');
          this.router.navigate(['/service-orders']);
        },
        error: (err) => {
          this.formState.update(s => ({ ...s, isSaving: false, error: err?.error?.message || 'Error cancelando la orden' }));
        }
      });
  }

  private setupCostCalculation(): void {
    this.costChangeSubject
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const price = this.toNumber(this.serviceOrderForm.get('price')?.value);
        const repairCost = this.toNumber(this.serviceOrderForm.get('repairCost')?.value);
        const discount = this.toNumber(this.serviceOrderForm.get('costdiscount')?.value);
        const tax = this.toNumber(this.serviceOrderForm.get('tax')?.value);

        const total = price + repairCost - discount + tax;
        const safeTotal = Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
        this.serviceOrderForm.get('totalCost')?.setValue(safeTotal, { emitEvent: false });
      });

    // Listen to cost field changes
    ['price', 'repairCost', 'costdiscount', 'tax'].forEach(field => {
      this.serviceOrderForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.costChangeSubject.next());
    });
  }

  private toNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private setupCenterChange(): void {
    this.serviceOrderForm.get('centerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((centerId) => {
        this.selectedCenterId.set(centerId);
        // Reset store to default "Seleccionar tienda..." when center changes
        this.serviceOrderForm.get('storeId')?.setValue('', { emitEvent: false });
      });
    
    // Set initial value if form already has a center
    const initialCenterId = this.serviceOrderForm.get('centerId')?.value;
    if (initialCenterId) {
      this.selectedCenterId.set(initialCenterId);
    }
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();
    switch (step) {
      case 0:
        if (this.showCenterAndStoreFields()) {
          return (this.serviceOrderForm.get('centerId')?.valid ?? false) &&
                 (this.serviceOrderForm.get('storeId')?.valid ?? false);
        }
        if (this.showOnlyStoreField()) {
          return (this.serviceOrderForm.get('storeId')?.valid ?? false);
        }
        if (this.hideLocationFields()) {
          return true;
        }
        return false;
      case 1:
        return (this.serviceOrderForm.get('customerId')?.valid ?? false) &&
               (this.serviceOrderForm.get('deviceId')?.valid ?? false) &&
               (this.serviceOrderForm.get('deviceBrandId')?.valid ?? false);
      case 2:
        return (this.serviceOrderForm.get('model')?.valid ?? false);
      case 3:
        return this.serviceOrderForm.valid ?? false;
      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.canProceedToNextStep() && this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  getStepProgress(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  onSubmit(): void {
    if (this.serviceOrderForm.invalid) {
      this.markFormGroupTouched(this.serviceOrderForm);
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const orderData = this.serviceOrderForm.getRawValue();
    const request = this.isEditMode()
      ? this.serviceOrdersService.update(this.currentServiceOrderId()!, orderData)
      : this.serviceOrdersService.create(orderData);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.formState.update(s => ({ ...s, isSaving: false, success: true }));
          const msg = this.isEditMode() ? 'Orden de servicio actualizada' : 'Orden de servicio creada';
          this.toastService.success(msg);
          setTimeout(() => {
            this.router.navigate(['/service-orders']);
          }, 1500);
        },
        error: (err) => {
          this.formState.update(s => ({
            ...s,
            isSaving: false,
            error: err?.error?.message || 'Error al guardar la orden'
          }));
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/service-orders']);
  }

  openCustomerSearch(): void {
    this.showCustomerSearch = true;
  }

  openCustomerForm(): void {
    this.editingCustomer = null;
    this.showCustomerModal = true;
  }

  closeCustomerForm(): void {
    this.showCustomerModal = false;
  }


  closeCustomerSearch(): void {
    this.showCustomerSearch = false;
  }

  onCustomerSelected(customer: any): void {
    if (customer && customer.id) {
      this.serviceOrderForm.get('customerId')?.setValue(customer.id);
      this.customersService.getAll().pipe(takeUntil(this.destroy$)).subscribe(c => this.customers.set(c || []));
      this.toastService.success('Cliente seleccionado');
    }
    this.closeCustomerSearch();
  }

  onCustomerSaved(payload: Customers): void {
    this.customersService.create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.toastService.success('Cliente creado');
          const list = this.customers();
          this.customers.set([...(list || []), created as any]);
          if ((created as any)?.id) {
            this.serviceOrderForm.get('customerId')?.setValue((created as any).id);
          }
          this.closeCustomerForm();
        },
        error: () => this.toastService.error('Error creando cliente')
      });
  }

  openAddDevice(): void {
    this.editingDevice = { name: '', centerId: this.serviceOrderForm.get('centerId')?.value ?? null };
    this.showDeviceModal = true;
  }

  openEditDevice(device: any): void {
    this.editingDevice = device;
    this.showDeviceModal = true;
  }

  closeDeviceModal(): void {
    this.editingDevice = null;
    this.showDeviceModal = false;
  }

  openAddDeviceBrand(): void {
    this.editingDeviceBrand = { name: '', centerId: this.serviceOrderForm.get('centerId')?.value ?? null };
    this.showDeviceBrandModal = true;
  }

  openEditDeviceBrand(brand: any): void {
    this.editingDeviceBrand = brand;
    this.showDeviceBrandModal = true;
  }

  closeDeviceBrandModal(): void {
    this.editingDeviceBrand = null;
    this.showDeviceBrandModal = false;
  }

  openAddPaymentType(): void {
    this.editingPaymentType = { type: null, createdAt: new Date() as any };
    this.showPaymentTypeModal = true;
  }

  openEditPaymentType(paymentType: any): void {
    this.editingPaymentType = paymentType;
    this.showPaymentTypeModal = true;
  }

  closePaymentTypeModal(): void {
    this.editingPaymentType = null;
    this.showPaymentTypeModal = false;
  }

  onDeviceSaved(payload: Partial<any>): void {
    const emittedId = (payload as any)?.id;
    const editingId = (this.editingDevice as any)?.id;

    if (emittedId) {
      this.devicesService.getAll().pipe(takeUntil(this.destroy$)).subscribe(d => this.devices.set(d || []));
      this.serviceOrderForm.get('deviceId')?.setValue(emittedId);
      this.closeDeviceModal();
      this.toastService.success('Device guardado');
      return;
    }

    if (editingId) {
      this.devicesService.update(editingId, payload).subscribe({
        next: () => {
          this.devicesService.getAll().pipe(takeUntil(this.destroy$)).subscribe(d => this.devices.set(d || []));
          this.closeDeviceModal();
          this.toastService.success('Device actualizado');
        },
        error: () => this.toastService.error('Error actualizando device')
      });
    } else {
      this.devicesService.create(payload).subscribe({
        next: (created) => {
          this.devicesService.getAll().pipe(takeUntil(this.destroy$)).subscribe(d => this.devices.set(d || []));
          this.serviceOrderForm.get('deviceId')?.setValue((created as any).id);
          this.closeDeviceModal();
          this.toastService.success('Device creado');
        },
        error: () => this.toastService.error('Error creando device')
      });
    }
  }

  onDeviceBrandSaved(payload: Partial<any>): void {
    const emittedId = (payload as any)?.id;
    const editingId = (this.editingDeviceBrand as any)?.id;

    if (emittedId) {
      this.deviceBrandsService.getAll().pipe(takeUntil(this.destroy$)).subscribe(b => this.deviceBrands.set(b || []));
      this.serviceOrderForm.get('deviceBrandId')?.setValue(emittedId);
      this.closeDeviceBrandModal();
      this.toastService.success('Marca guardada');
      return;
    }

    if (editingId) {
      this.deviceBrandsService.update(editingId, payload).subscribe({
        next: () => {
          this.deviceBrandsService.getAll().pipe(takeUntil(this.destroy$)).subscribe(b => this.deviceBrands.set(b || []));
          this.closeDeviceBrandModal();
          this.toastService.success('Marca actualizada');
        },
        error: () => this.toastService.error('Error actualizando marca')
      });
    } else {
      this.deviceBrandsService.create(payload).subscribe({
        next: (created) => {
          this.deviceBrandsService.getAll().pipe(takeUntil(this.destroy$)).subscribe(b => this.deviceBrands.set(b || []));
          this.serviceOrderForm.get('deviceBrandId')?.setValue((created as any).id);
          this.closeDeviceBrandModal();
          this.toastService.success('Marca creada');
        },
        error: () => this.toastService.error('Error creando marca')
      });
    }
  }

  onPaymentTypeSaved(payload: Partial<any>): void {
    const emittedId = (payload as any)?.id;
    const editingId = (this.editingPaymentType as any)?.id;

    if (emittedId) {
      this.paymentTypesService.getAll().pipe(takeUntil(this.destroy$)).subscribe(p => this.paymentTypes.set(p || []));
      this.serviceOrderForm.get('paymentTypeId')?.setValue(emittedId);
      this.closePaymentTypeModal();
      this.toastService.success('Tipo de pago guardado');
      return;
    }

    if (editingId) {
      this.paymentTypesService.update(editingId, payload).subscribe({
        next: () => {
          this.paymentTypesService.getAll().pipe(takeUntil(this.destroy$)).subscribe(p => this.paymentTypes.set(p || []));
          this.closePaymentTypeModal();
          this.toastService.success('Tipo de pago actualizado');
        },
        error: () => this.toastService.error('Error actualizando tipo de pago')
      });
    } else {
      this.paymentTypesService.create(payload).subscribe({
        next: (created) => {
          this.paymentTypesService.getAll().pipe(takeUntil(this.destroy$)).subscribe(p => this.paymentTypes.set(p || []));
          this.serviceOrderForm.get('paymentTypeId')?.setValue((created as any).id);
          this.closePaymentTypeModal();
          this.toastService.success('Tipo de pago creado');
        },
        error: () => this.toastService.error('Error creando tipo de pago')
      });
    }
  }

  openAddNote(): void {
    this.editingNote = { createdAt: new Date() as any };
    this.showNoteModal = true;
  }

  openEditNote(note: SONotes): void {
    this.editingNote = note;
    this.showNoteModal = true;
  }

  closeNoteModal(): void {
    this.editingNote = null;
    this.showNoteModal = false;
  }

  openAddDiagnostic(): void {
    this.editingDiagnostic = { createdAt: new Date() as any };
    this.showDiagnosticModal = true;
  }

  openEditDiagnostic(diagnostic: SODiagnostic): void {
    this.editingDiagnostic = diagnostic;
    this.showDiagnosticModal = true;
  }

  closeDiagnosticModal(): void {
    this.editingDiagnostic = null;
    this.showDiagnosticModal = false;
  }

  openAddItem(): void {
    this.editingItem = { serviceOrderId: this.currentServiceOrderId() ?? undefined, createdAt: new Date() as any, updatedAt: new Date() as any };
    this.showItemModal = true;
  }

  openEditItem(item: SOItems): void {
    this.editingItem = item;
    this.showItemModal = true;
  }

  closeItemModal(): void {
    this.editingItem = null;
    this.showItemModal = false;
  }

  openAddStatus(): void {
    this.editingStatus = { createdAt: new Date() as any };
    this.showStatusModal = true;
  }

  openEditStatus(status: RepairStatus): void {
    this.editingStatus = status;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.editingStatus = null;
    this.showStatusModal = false;
  }

  onNoteSaved(payload: Partial<SONotes>): void {
    const id = (this.editingNote as SONotes)?.id;
    const p = payload as SONotes;
    const sanitized: Partial<SONotes> = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : this.currentServiceOrderId() ?? undefined,
      note: p.note,
      createdById: p.createdById != null ? Number(p.createdById) : undefined
    };

    if (id) {
      this.soNotesService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeNoteModal(); this.toastService.success('Nota actualizada'); },
        error: () => this.toastService.error('Error actualizando nota')
      });
    } else {
      this.soNotesService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeNoteModal(); this.toastService.success('Nota creada'); },
        error: () => this.toastService.error('Error creando nota')
      });
    }
  }

  onDiagnosticSaved(payload: Partial<SODiagnostic>): void {
    const id = (this.editingDiagnostic as any)?.id;
    const p = payload as SODiagnostic;
    const sanitized: Partial<SODiagnostic> = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : this.currentServiceOrderId() ?? undefined,
      diagnostic: p.diagnostic,
      sendEmail: !!p.sendEmail,
      createdAt: p.createdAt,
      createdById: p.createdById != null ? Number(p.createdById) : undefined
    };

    if (id) {
      this.soDiagnosticService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeDiagnosticModal(); this.toastService.success('Diagnóstico actualizado'); },
        error: () => this.toastService.error('Error actualizando diagnóstico')
      });
    } else {
      this.soDiagnosticService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeDiagnosticModal(); this.toastService.success('Diagnóstico creado'); },
        error: () => this.toastService.error('Error creando diagnóstico')
      });
    }
  }

  onItemSaved(payload: Partial<SOItems>): void {
    const id = (this.editingItem as any)?.id;
    const p = payload as SOItems;
    const sanitized: Partial<SOItems> = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : this.currentServiceOrderId() ?? undefined,
      itemId: p.itemId != null ? Number(p.itemId) : undefined, // itemId agregado
      quantity: p.quantity != null ? Number(p.quantity) : undefined,
      cost: p.cost != null ? Number(p.cost) : undefined,
      price: p.price != null ? Number(p.price) : undefined,
      discount: p.discount != null ? Number(p.discount) : undefined,
      note: p.note,
      createdById: p.createdById != null ? Number(p.createdById) : undefined
      // Removido createdAt, updatedAt, createdById (no están en el DTO del backend)
    };

    if (id) {
      this.soItemsService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeItemModal(); this.toastService.success('Item actualizado'); },
        error: () => this.toastService.error('Error actualizando item')
      });
    } else {
      this.soItemsService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeItemModal(); this.toastService.success('Item creado'); },
        error: () => this.toastService.error('Error creando item')
      });
    }
  }

  onStatusSaved(payload: Partial<RepairStatus>): void {
    const id = (this.editingStatus as any)?.id;
    const p = payload as RepairStatus;
    const sanitized: any = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : this.currentServiceOrderId() ?? undefined,
      status: p.status,
      createdById: p.createdById != null ? Number(p.createdById) : undefined
    };

    if (id) {
      this.repairStatusService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeStatusModal(); this.toastService.success('Estado actualizado'); },
        error: () => this.toastService.error('Error actualizando estado')
      });
    } else {
      this.repairStatusService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeStatusModal(); this.toastService.success('Estado creado'); },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error creando estado';
          this.toastService.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
      });
    }
  }

  deleteNote(id: number): void {
    if (!confirm('¿Eliminar nota?')) return;
    this.soNotesService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Nota eliminada'); },
      error: () => this.toastService.error('Error eliminando nota')
    });
  }

  deleteDiagnostic(id: number): void {
    if (!confirm('¿Eliminar diagnóstico?')) return;
    this.soDiagnosticService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Diagnóstico eliminado'); },
      error: () => this.toastService.error('Error eliminando diagnóstico')
    });
  }

  deleteItem(id: number): void {
    if (!confirm('¿Eliminar item?')) return;
    this.soItemsService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Item eliminado'); },
      error: () => this.toastService.error('Error eliminando item')
    });
  }

  deleteStatus(id: number): void {
    if (!confirm('¿Eliminar estado?')) return;
    this.repairStatusService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Estado eliminado'); },
      error: () => this.toastService.error('Error eliminando estado')
    });
  }

  private loadRelatedCollections(): void {
    const id = this.currentServiceOrderId();
    if (!id) {
      this.soNotes = [];
      this.soDiagnostics = [];
      this.soItems = [];
      this.repairStatuses = [];
      return;
    }

    this.soNotesService.getAll().subscribe(all => {
      this.soNotes = (all || []).filter(n => (n.serviceOrder && (n.serviceOrder as any).id) === id);
    });

    this.soDiagnosticService.getAll().subscribe(all => {
      this.soDiagnostics = (all || []).filter(d => (d.serviceOrder && (d.serviceOrder as any).id) === id);
    });

    this.soItemsService.getAll().subscribe(all => {
      this.soItems = (all || []).filter(i => (i.serviceOrderId ?? (i.serviceOrder && (i.serviceOrder as any).id)) === id);
    });

    this.repairStatusService.getAll().subscribe(all => {
      this.repairStatuses = (all || []).filter(r => (r.serviceOrder && (r.serviceOrder as any).id) === id);
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.serviceOrderForm.get(fieldName);
    if (!field?.errors || !field?.touched) return null;

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Mínimo ${field.errors['min'].min}`;
    if (field.errors['max']) return `Máximo ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Formato inválido';

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceOrderForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  clearError(): void {
    this.formState.update(s => ({ ...s, error: null }));
  }
}
