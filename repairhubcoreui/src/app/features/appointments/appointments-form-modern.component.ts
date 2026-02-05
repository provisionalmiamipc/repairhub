import { Component, signal, computed, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Appointments } from '../../shared/models/Appointments';
import { Devices } from '../../shared/models/Devices';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { DevicesService } from '../../shared/services/devices.service';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { AuthService } from '../../shared/services/auth.service';
import { DevicesFormComponent } from '../devices/devices-form.component';
import { ServiceTypesFormComponent } from '../service-types/service-types-form.component';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-appointments-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DevicesFormComponent, ServiceTypesFormComponent],
  templateUrl: './appointments-form-modern.component.html',
  //styleUrls: ['./appointments-form-modern.component.scss'],
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
export class AppointmentsFormModernComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appointmentsService = inject(AppointmentsService);
  private devicesService = inject(DevicesService);
  private serviceTypesService = inject(ServiceTypesService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly formState = signal<FormState>({
    isLoading: false,
    isSaving: false,
    error: null,
    success: false,
    isEditMode: false
  });

  readonly currentAppointmentId = signal<number | null>(null);
  readonly devices = signal<Devices[]>([]);
  readonly serviceTypes = signal<ServiceTypes[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly selectedCenterId = signal<number | null>(null);
  readonly minDate = signal<string>(this.getTodayDate());
  readonly userType = signal<'employee' | 'user' | null>(this.authService.getUserType());
  readonly showDeviceModal = signal(false);
  readonly showServiceTypeModal = signal(false);
  readonly showStatusConfirmModal = signal(false);
  readonly pendingStatusAction = signal<'close' | 'cancel' | null>(null);
  readonly currentEmployee = computed(() => this.authService.getCurrentEmployee());
  readonly isCenterAdmin = computed(() => this.currentEmployee()?.isCenterAdmin ?? false);
  readonly showCenterAndStoreFields = computed(() => this.userType() === 'user');
  readonly showOnlyStoreField = computed(() => this.userType() === 'employee' && this.isCenterAdmin());
  readonly hideLocationFields = computed(() => this.userType() === 'employee' && !this.isCenterAdmin());

  appointmentForm!: FormGroup;
  deviceModalDefaults: Partial<Devices> | null = null;

  isLoading = computed(() => this.formState().isLoading);
  isSaving = computed(() => this.formState().isSaving);
  error = computed(() => this.formState().error);
  success = computed(() => this.formState().success);
  isEditMode = computed(() => this.formState().isEditMode);
  isUserTypeUser = computed(() => this.userType() === 'user');
  isAppointmentClosed = computed(() => this.appointmentForm?.get('cloused')?.value || this.appointmentForm?.get('canceled')?.value || false);

  steps = [
    {
      id: 0,
      title: 'Información Básica',
      description: 'Cliente, fecha y hora'
    },
    {
      id: 1,
      title: 'Dispositivo y Servicio',
      description: 'Dispositivo, tipo de servicio y duración'
    },
    {
      id: 2,
      title: 'Notas',
      description: 'Información adicional y estado'
    }
  ];

  currentStep = signal(0);

  ngOnInit(): void {
    this.initForm();
    this.initContextDefaults();
    this.initCenterStoreListeners();
    this.loadCenters();
    this.loadStores();
    this.loadDevices();
    this.loadServiceTypes();
    this.checkEditMode();
  }

  private initForm(): void {
    this.appointmentForm = this.fb.group({
      centerId: ['', [Validators.required]],
      storeId: ['', [Validators.required]],
      createdById: [''],
      customer: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', [Validators.required]],
      time: ['', [Validators.required]],
      deviceId: ['', [Validators.required]],
      serviceTypeId: ['', [Validators.required]],
      duration: [30, [Validators.required, Validators.min(15), Validators.max(480)]],
      notes: [''],
      cloused: [false],
      canceled: [false]
    });

    this.applyUserTypeRules();
  }

  private applyUserTypeRules(): void {
    const isUser = this.userType() === 'user';
    const isEmployee = this.userType() === 'employee';
    const isAdminCenter = isEmployee && this.isCenterAdmin();
    const centerControl = this.appointmentForm.get('centerId');
    const storeControl = this.appointmentForm.get('storeId');

    if (isUser) {
      centerControl?.setValidators([Validators.required]);
      storeControl?.setValidators([Validators.required]);
      centerControl?.enable({ emitEvent: false });
      storeControl?.enable({ emitEvent: false });
    } else if (isAdminCenter) {
      centerControl?.clearValidators();
      storeControl?.setValidators([Validators.required]);
      centerControl?.disable({ emitEvent: false });
      storeControl?.enable({ emitEvent: false });
    } else {
      centerControl?.clearValidators();
      storeControl?.clearValidators();
      centerControl?.disable({ emitEvent: false });
      storeControl?.disable({ emitEvent: false });
    }

    centerControl?.updateValueAndValidity({ emitEvent: false });
    storeControl?.updateValueAndValidity({ emitEvent: false });

    this.applyEmployeeDefaults();
  }

  private applyEmployeeDefaults(): void {
    if (this.userType() !== 'employee') {
      return;
    }

    const centerControl = this.appointmentForm.get('centerId');
    const storeControl = this.appointmentForm.get('storeId');
    const empCenterId = this.authService.getCenterId();
    const empStoreId = this.authService.getStoreId();

    if (empCenterId != null) {
      centerControl?.setValue(empCenterId, { emitEvent: false });
      this.selectedCenterId.set(empCenterId);
    }

    if (this.isCenterAdmin()) {
      if (storeControl && (storeControl.value == null || storeControl.value === '')) {
        if (empStoreId != null) {
          storeControl.setValue(empStoreId, { emitEvent: false });
        }
      }
    } else if (empStoreId != null) {
      storeControl?.setValue(empStoreId, { emitEvent: false });
    }
  }

  private initCenterStoreListeners(): void {
    this.appointmentForm.get('centerId')?.valueChanges.subscribe(centerId => {
      const normalized = this.normalizeId(centerId);
      if (normalized !== null) {
        this.selectedCenterId.set(normalized);
        this.appointmentForm.get('storeId')?.reset('');
      } else {
        this.selectedCenterId.set(null);
        this.appointmentForm.get('storeId')?.reset('');
      }
    });

    // Escuchar cambios en cloused y canceled para deshabilitar campos
    this.appointmentForm.get('cloused')?.valueChanges.subscribe(() => {
      this.updateFieldsEnabledState();
    });

    this.appointmentForm.get('canceled')?.valueChanges.subscribe(() => {
      this.updateFieldsEnabledState();
    });
  }

  private updateFieldsEnabledState(): void {
    const isClosed = this.appointmentForm.get('cloused')?.value || this.appointmentForm.get('canceled')?.value;
    const fieldsToToggle = ['customer', 'date', 'time', 'deviceId', 'serviceTypeId', 'duration', 'notes'];

    fieldsToToggle.forEach(fieldName => {
      const control = this.appointmentForm.get(fieldName);
      if (isClosed) {
        control?.disable({ emitEvent: false });
      } else {
        control?.enable({ emitEvent: false });
      }
    });
  }

  private initContextDefaults(): void {
    const centerId = this.authService.getCenterId();
    const storeId = this.authService.getStoreId();
    const createdById = this.authService.getEmployeeId();
    const userType = this.authService.getUserType();

    if (userType !== 'user') {
      if (centerId != null) {
        this.appointmentForm.get('centerId')?.setValue(centerId, { emitEvent: false });
        this.selectedCenterId.set(centerId);
      }
      if (storeId != null) {
        this.appointmentForm.get('storeId')?.setValue(storeId, { emitEvent: false });
      }
      if (createdById) this.appointmentForm.get('createdById')?.setValue(createdById);
    }
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentAppointmentId.set(parseInt(id, 10));
      this.formState.update(s => ({ ...s, isEditMode: true, isLoading: true }));
      this.loadAppointment(parseInt(id, 10));
    }
  }

  private loadAppointment(id: number): void {
    this.appointmentsService.getById(id).subscribe({
      next: (appointment) => {
        this.appointmentForm.patchValue(appointment);
        const normalized = this.normalizeId(appointment.centerId);
        if (normalized !== null) {
          this.selectedCenterId.set(normalized);
        }
        this.applyEmployeeDefaults();
        this.updateFieldsEnabledState();
        this.lockFormIfClosed();
        this.formState.update(s => ({ ...s, isLoading: false }));
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isLoading: false,
          error: err?.error?.message || 'Error cargando la cita'
        }));
      }
    });
  }

  private loadDevices(): void {
    this.devicesService.getAll().subscribe({
      next: (devices) => {
        this.devices.set(devices || []);
      },
      error: (err) => {
        console.error('Error loading devices:', err);
      }
    });
  }

  private loadCenters(): void {
    this.centersService.getAll().subscribe({
      next: (centers) => {
        this.centers.set(centers || []);
      },
      error: (err) => {
        console.error('Error loading centers:', err);
      }
    });
  }

  private loadStores(): void {
    this.storesService.getAll().subscribe({
      next: (stores) => {
        this.stores.set(stores || []);
      },
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }

  private loadServiceTypes(): void {
    this.serviceTypesService.getAll().subscribe({
      next: (types) => {
        this.serviceTypes.set(types || []);
      },
      error: (err) => {
        console.error('Error loading service types:', err);
      }
    });
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();
    const isClosed = this.isAppointmentClosed();
    
    // Si la cita está cerrada, permitir navegar sin validar (solo ir al paso anterior)
    if (isClosed && step > 0) {
      return true;
    }
    
    switch (step) {
      case 0:
        return (this.appointmentForm.get('customer')?.valid ?? false) &&
               (this.appointmentForm.get('date')?.valid ?? false) &&
               (this.appointmentForm.get('time')?.valid ?? false);
      case 1:
        return (this.appointmentForm.get('deviceId')?.valid ?? false) &&
               (this.appointmentForm.get('serviceTypeId')?.valid ?? false) &&
               (this.appointmentForm.get('duration')?.valid ?? false);
      case 2:
        return this.appointmentForm.valid ?? false;
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

  createDevice(): void {
    const userType = this.authService.getUserType();
    let centerId: number | null = null;
    let storeId: number | null = null;

    if (userType === 'user') {
      centerId = this.normalizeId(this.appointmentForm.get('centerId')?.value);
      storeId = this.normalizeId(this.appointmentForm.get('storeId')?.value);
    } else {
      centerId = this.normalizeId(this.authService.getCenterId());
      if (this.isCenterAdmin()) {
        storeId = this.normalizeId(this.appointmentForm.get('storeId')?.value ?? this.authService.getStoreId());
      } else {
        storeId = this.normalizeId(this.authService.getStoreId());
      }
    }

    this.deviceModalDefaults = {
      centerId: centerId ?? undefined,
      storeId: storeId ?? undefined,
    };
    this.showDeviceModal.set(true);
  }

  createServiceType(): void {
    this.showServiceTypeModal.set(true);
  }

  closeDeviceModal(): void {
    this.showDeviceModal.set(false);
  }

  closeServiceTypeModal(): void {
    this.showServiceTypeModal.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showServiceTypeModal()) {
      this.closeServiceTypeModal();
      return;
    }
    if (this.showDeviceModal()) {
      this.closeDeviceModal();
    }
  }

  onDeviceSaved(device: Devices): void {
    this.showDeviceModal.set(false);
    this.loadDevices();
    if (device?.id) {
      this.appointmentForm.get('deviceId')?.setValue(device.id);
    }
  }

  onServiceTypeSaved(serviceType: ServiceTypes): void {
    this.showServiceTypeModal.set(false);
    this.loadServiceTypes();
    if (serviceType?.id) {
      this.appointmentForm.get('serviceTypeId')?.setValue(serviceType.id);
    }
  }

  getStepProgress(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  onSubmit(): void {
    if (this.isAppointmentClosed()) {
      return;
    }
    const userType = this.authService.getUserType();
    if (userType !== 'user') {
      const centerId = this.authService.getCenterId();
      const storeId = this.authService.getStoreId();
      if (centerId != null) {
        this.appointmentForm.get('centerId')?.setValue(centerId, { emitEvent: false });
      }

      if (this.isCenterAdmin()) {
        if (!this.appointmentForm.get('storeId')?.value && storeId != null) {
          this.appointmentForm.get('storeId')?.setValue(storeId, { emitEvent: false });
        }
      } else if (storeId != null) {
        this.appointmentForm.get('storeId')?.setValue(storeId, { emitEvent: false });
      }
    }

    if (!this.appointmentForm.get('createdById')?.value) {
      const createdById = this.authService.getEmployeeId();
      if (userType !== 'user' && createdById) {
        this.appointmentForm.get('createdById')?.setValue(createdById);
      }
    }

    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const appointmentData = this.appointmentForm.getRawValue();
    if (userType !== 'user') {
      appointmentData.centerId = this.normalizeId(this.authService.getCenterId());
      if (this.isCenterAdmin()) {
        appointmentData.storeId = this.normalizeId(appointmentData.storeId ?? this.authService.getStoreId());
      } else {
        appointmentData.storeId = this.normalizeId(this.authService.getStoreId());
      }
    }
    appointmentData.centerId = this.normalizeId(appointmentData.centerId);
    appointmentData.storeId = this.normalizeId(appointmentData.storeId);
    appointmentData.createdById = this.normalizeId(appointmentData.createdById);
    const request = this.isEditMode()
      ? this.appointmentsService.update(this.currentAppointmentId()!, appointmentData)
      : this.appointmentsService.create(appointmentData);

    request.subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isSaving: false, success: true }));
        setTimeout(() => {
          this.router.navigate(['/appointments']);
        }, 1500);
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isSaving: false,
          error: err?.error?.message || 'Error al guardar la cita'
        }));
      }
    });
  }

  onCancel(): void {
    
      this.router.navigate(['/appointments']);
      return;
    
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.appointmentForm.get(fieldName);
    if (!field?.errors || !field?.touched) return null;

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Mínimo ${field.errors['min'].min}`;
    if (field.errors['max']) return `Máximo ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Formato inválido';

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  clearError(): void {
    this.formState.update(s => ({ ...s, error: null }));
  }

  openStatusConfirm(action: 'close' | 'cancel'): void {
    if (!this.isEditMode() || this.isAppointmentClosed()) {
      return;
    }
    this.pendingStatusAction.set(action);
    this.showStatusConfirmModal.set(true);
  }

  cancelStatusConfirm(): void {
    this.showStatusConfirmModal.set(false);
    this.pendingStatusAction.set(null);
  }

  confirmStatusChange(): void {
    if (!this.currentAppointmentId()) {
      return;
    }

    const action = this.pendingStatusAction();
    if (!action) {
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const appointmentData = this.appointmentForm.getRawValue();
    appointmentData.cloused = action === 'close';
    appointmentData.canceled = action === 'cancel';

    this.appointmentsService.update(this.currentAppointmentId()!, appointmentData).subscribe({
      next: (updated) => {
        this.appointmentForm.patchValue(updated);
        this.updateFieldsEnabledState();
        this.lockFormIfClosed();
        this.formState.update(s => ({ ...s, isSaving: false, success: true }));
        this.cancelStatusConfirm();
        setTimeout(() => {
          this.router.navigate(['/appointments']);
        }, 1000);
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isSaving: false,
          error: err?.error?.message || 'Error al actualizar la cita'
        }));
      }
    });
  }

  private normalizeId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private lockFormIfClosed(): void {
    if (this.isAppointmentClosed()) {
      this.appointmentForm.disable({ emitEvent: false });
    }
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
