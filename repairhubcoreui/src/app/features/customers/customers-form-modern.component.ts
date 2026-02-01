import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Customers } from '../../shared/models/Customers';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CustomersService } from '../../shared/services/customers.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-customers-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customers-form-modern.component.html',
  styleUrls: ['./customers-form-modern.component.scss'],
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
export class CustomersFormModernComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customersService = inject(CustomersService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly formState = signal<FormState>({
    isLoading: false,
    isSaving: false,
    error: null,
    success: false,
    isEditMode: false
  });

  readonly currentCustomerId = signal<number | null>(null);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly selectedCenterId = signal<number | null>(null);
  readonly customerCode = signal<string>('');

  customerForm!: FormGroup;

  isLoading = computed(() => this.formState().isLoading);
  isSaving = computed(() => this.formState().isSaving);
  error = computed(() => this.formState().error);
  success = computed(() => this.formState().success);
  isEditMode = computed(() => this.formState().isEditMode);

  steps = [
    {
      id: 0,
      title: 'Centro y Tienda',
      description: 'Selecciona el centro y tienda del cliente'
    },
    {
      id: 1,
      title: 'Información Personal',
      description: 'Nombre, tipo y género del cliente'
    },
    {
      id: 2,
      title: 'Contacto',
      description: 'Email, teléfono y ubicación'
    },
    {
      id: 3,
      title: 'Datos Comerciales',
      description: 'Código, descuento e información extra'
    }
  ];

  currentStep = signal(0);

  ngOnInit(): void {
    this.initForm();
    this.loadCenters();
    this.checkEditMode();
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      centerId: ['', [Validators.required]],
      storeId: ['', []],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      gender: ['', [Validators.required]],
      b2b: [false],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]{10,}$/)]],
      city: ['', [Validators.required]],
      discount: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      extraInfo: ['']
    });

    // Listener para cambios en centerId
    this.customerForm.get('centerId')?.valueChanges.subscribe(centerId => {
      const normalized = this.normalizeId(centerId);
      if (normalized !== null) {
        this.selectedCenterId.set(normalized);
        this.loadStoresForCenter(normalized);
        this.customerForm.get('storeId')?.reset('');
      } else {
        this.selectedCenterId.set(null);
        this.stores.set([]);
        this.customerForm.get('storeId')?.reset('');
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentCustomerId.set(parseInt(id, 10));
      this.formState.update(s => ({ ...s, isEditMode: true, isLoading: true }));
      this.loadCustomer(parseInt(id, 10));
    }
  }

  private loadCustomer(id: number): void {
    this.customersService.getById(id).subscribe({
      next: (customer) => {
        this.customerForm.patchValue(customer);
        this.customerCode.set(customer.customerCode || '');
        if (customer.centerId) {
          const normalized = this.normalizeId(customer.centerId);
          if (normalized !== null) {
            this.selectedCenterId.set(normalized);
            this.loadStoresForCenter(normalized);
          }
        }
        this.formState.update(s => ({ ...s, isLoading: false }));
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isLoading: false,
          error: err?.error?.message || 'Error cargando el cliente'
        }));
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

  private loadStoresForCenter(centerId: number): void {
    this.storesService.getAll().subscribe({
      next: (stores) => {
        const filtered = (stores || []).filter(s => s.centerId === centerId);
        this.stores.set(filtered);
      },
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }

  private normalizeId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();
    switch (step) {
      case 0:
        return (this.customerForm.get('centerId')?.valid ?? false) && (this.customerForm.get('storeId')?.valid ?? false);
      case 1:
        return (this.customerForm.get('firstName')?.valid ?? false) && 
               (this.customerForm.get('lastName')?.valid ?? false) &&
               (this.customerForm.get('gender')?.valid ?? false);
      case 2:
        return (this.customerForm.get('email')?.valid ?? false) && 
               (this.customerForm.get('city')?.valid ?? false);
      case 3:
        if (this.isEditMode()) {
          return this.customerForm.valid ?? false;
        }

        return this.customerForm.valid ?? false;
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

  onStepClick(stepId: number): void {
    if (this.isEditMode()) {
      this.currentStep.set(stepId);
    }
  }

  getStepProgress(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.markFormGroupTouched(this.customerForm);
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const customerData = this.customerForm.value;
    if (!this.customerForm.get('storeId')?.value) {
      delete (customerData as any).storeId;
    }
    const request = this.isEditMode()
      ? this.customersService.update(this.currentCustomerId()!, customerData)
      : this.customersService.create(customerData);

    request.subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isSaving: false, success: true }));
        setTimeout(() => {
          this.router.navigate(['/customers']);
        }, 1500);
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isSaving: false,
          error: err?.error?.message || 'Error al guardar el cliente'
        }));
      }
    });
  }

  onCancel(): void {
    if (confirm('¿Descartar cambios?')) {
      this.router.navigate(['/customers']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.customerForm.get(fieldName);
    if (!field?.errors || !field?.touched) return null;

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['pattern']) return 'Formato inválido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['min']) return `Mínimo ${field.errors['min'].min}`;
    if (field.errors['max']) return `Máximo ${field.errors['max'].max}`;

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.customerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
