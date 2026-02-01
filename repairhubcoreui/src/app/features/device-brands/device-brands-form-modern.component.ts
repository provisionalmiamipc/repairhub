import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-device-brands-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './device-brands-form-modern.component.html',
  styleUrl: './device-brands-form-modern.component.scss',
})
export class DeviceBrandsFormModernComponent implements OnInit {
  private fb = inject(FormBuilder);
  private deviceBrandsService = inject(DeviceBrandsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly formState = signal<FormState>({ isLoading: false, error: null, success: false, isEditMode: false });
  readonly currentStep = signal(0);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly selectedCenterId = signal<number | null>(null);

  deviceBrandForm!: FormGroup;
  deviceBrandId: number | null = null;

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
    this.deviceBrandForm = this.fb.group({
      // Step 0: Centro y Tienda
      centerId: [null, Validators.required],
      storeId: [{ value: null, disabled: true }, Validators.required],

      // Step 1: Datos de la Marca
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      img: [''],
    });

    this.deviceBrandForm.get('centerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((centerId) => {
        this.selectedCenterId.set(centerId ? Number(centerId) : null);
        if (centerId) {
          this.deviceBrandForm.get('storeId')?.enable();
        } else {
          this.deviceBrandForm.patchValue({ storeId: null });
          this.deviceBrandForm.get('storeId')?.disable();
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
        this.deviceBrandId = Number(id);
        this.formState.update(s => ({ ...s, isEditMode: true }));
        this.loadDeviceBrandData(this.deviceBrandId);
      }
    });
  }

  private loadDeviceBrandData(id: number) {
    this.formState.update(s => ({ ...s, isLoading: true }));
    this.deviceBrandsService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (brand) => {
          this.deviceBrandForm.patchValue({
            centerId: brand.centerId || null,
            storeId: brand.storeId || null,
            name: brand.name || '',
            description: brand.description || '',
            img: brand.img || '',
          });
          this.selectedCenterId.set(brand.centerId ? Number(brand.centerId) : null);
          if (brand.centerId) {
            this.deviceBrandForm.get('storeId')?.enable();
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
      const centerId = this.deviceBrandForm.get('centerId');
      const storeId = this.deviceBrandForm.get('storeId');
      return !!centerId?.valid && !!storeId?.valid;
    }

    return this.deviceBrandForm.valid;
  }

  onSubmit() {
    if (!this.deviceBrandForm.valid) {
      Object.keys(this.deviceBrandForm.controls).forEach(key => {
        this.deviceBrandForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.formState.update(s => ({ ...s, isLoading: true, error: null }));

    const brandData: Partial<DeviceBrands> = this.deviceBrandForm.value;

    const request$ = this.formState().isEditMode && this.deviceBrandId
      ? this.deviceBrandsService.update(this.deviceBrandId, brandData)
      : this.deviceBrandsService.create(brandData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isLoading: false, success: true }));
        setTimeout(() => this.router.navigate(['/device-brands']), 1500);
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, isLoading: false, error: err.message }));
      }
    });
  }

  cancel() {
    this.router.navigate(['/device-brands']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deviceBrandForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.deviceBrandForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}
