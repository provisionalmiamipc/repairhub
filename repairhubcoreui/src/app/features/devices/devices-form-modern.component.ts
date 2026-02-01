import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Devices } from '../../shared/models/Devices';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { DevicesService } from '../../shared/services/devices.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-devices-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './devices-form-modern.component.html',
  styleUrl: './devices-form-modern.component.scss',
})
export class DevicesFormModernComponent implements OnInit {
  private fb = inject(FormBuilder);
  private devicesService = inject(DevicesService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly formState = signal<FormState>({ isLoading: false, error: null, success: false, isEditMode: false });
  readonly currentStep = signal(0);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly selectedCenterId = signal<number | null>(null);

  deviceForm!: FormGroup;
  deviceId: number | null = null;

  private destroy$ = new Subject<void>();

  readonly filteredStores = computed(() => {
    const centerId = this.selectedCenterId();
    if (!centerId) return [];
    return this.stores().filter(store => store.centerId === Number(centerId));
  });

  readonly progressPercentage = computed(() => {
    return ((this.currentStep() + 1) / 2) * 100;
  });

  ngOnInit() {
    this.initForm();
    this.loadAllData();
    this.checkEditMode();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.deviceForm = this.fb.group({
      // Step 0: Centro y Tienda
      centerId: [null, Validators.required],
      storeId: [{ value: null, disabled: true }, Validators.required],

      // Step 1: Datos del Dispositivo
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });

    this.deviceForm.get('centerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((centerId) => {
        this.selectedCenterId.set(centerId ? Number(centerId) : null);
        if (centerId) {
          this.deviceForm.get('storeId')?.enable();
        } else {
          this.deviceForm.patchValue({ storeId: null });
          this.deviceForm.get('storeId')?.disable();
        }
      });
  }

  private loadAllData() {
    this.formState.update(s => ({ ...s, isLoading: true }));

    Promise.all([
      this.loadCenters(),
      this.loadStores(),
    ])
      .catch(error => {
        this.formState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.formState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private loadCenters() {
    return this.centersService.getAll().toPromise().then(data => {
      this.centers.set(data || []);
    });
  }

  private loadStores() {
    return this.storesService.getAll().toPromise().then(data => {
      this.stores.set(data || []);
    });
  }

  private checkEditMode() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.deviceId = Number(id);
        this.formState.update(s => ({ ...s, isEditMode: true }));
        this.loadDeviceData(this.deviceId);
      }
    });
  }

  private loadDeviceData(id: number) {
    this.formState.update(s => ({ ...s, isLoading: true }));
    this.devicesService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (device) => {
          this.deviceForm.patchValue({
            centerId: device.centerId || null,
            storeId: device.storeId || null,
            name: device.name || '',
            description: device.description || '',
          });
          this.selectedCenterId.set(device.centerId ? Number(device.centerId) : null);
          if (device.centerId) {
            this.deviceForm.get('storeId')?.enable();
          }
          this.formState.update(s => ({ ...s, isLoading: false }));
        },
        error: (err) => {
          this.formState.update(s => ({ ...s, isLoading: false, error: err.message }));
        }
      });
  }

  nextStep() {
    if (this.canProceedToNextStep()) {
      this.currentStep.update(step => Math.min(step + 1, 1));
    }
  }

  previousStep() {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();

    if (step === 0) {
      const centerId = this.deviceForm.get('centerId');
      const storeId = this.deviceForm.get('storeId');
      return !!centerId?.valid && !!storeId?.valid;
    }

    return this.deviceForm.valid;
  }

  onSubmit() {
    if (!this.deviceForm.valid) {
      Object.keys(this.deviceForm.controls).forEach(key => {
        this.deviceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.formState.update(s => ({ ...s, isLoading: true, error: null }));

    const deviceData: Partial<Devices> = this.deviceForm.value;

    const request$ = this.formState().isEditMode && this.deviceId
      ? this.devicesService.update(this.deviceId, deviceData)
      : this.devicesService.create(deviceData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isLoading: false, success: true }));
        setTimeout(() => this.router.navigate(['/devices']), 1500);
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, isLoading: false, error: err.message }));
      }
    });
  }

  cancel() {
    this.router.navigate(['/devices']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deviceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.deviceForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}
