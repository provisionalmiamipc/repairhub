import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Stores } from '../../shared/models/Stores';
import { Centers } from '../../shared/models/Centers';
import { StoresService } from '../../shared/services/stores.service';
import { CentersService } from '../../shared/services/centers.service';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-stores-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stores-form-modern.component.html',
  styleUrls: ['./stores-form-modern.component.scss'],
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
export class StoresFormModernComponent implements OnInit {
  // ============================================
  // 🔧 FORM STATE SIGNALS
  // ============================================
  
  readonly formState = signal<FormState>({
    isLoading: false,
    isSaving: false,
    error: null,
    success: false,
    isEditMode: false
  });

  readonly currentStoreId = signal<number | null>(null);
  readonly centers = signal<Centers[]>([]);

  // ============================================
  // 📋 FORM PROPERTIES
  // ============================================
  
  storeForm!: FormGroup;

  isLoading = computed(() => this.formState().isLoading);
  isSaving = computed(() => this.formState().isSaving);
  error = computed(() => this.formState().error);
  success = computed(() => this.formState().success);
  isEditMode = computed(() => this.formState().isEditMode);

  // Campos del formulario (4 pasos)
  steps = [
    {
      id: 0,
      title: 'Centro y Código',
      description: 'Selecciona el centro y código de la tienda'
    },
    {
      id: 1,
      title: 'Información Básica',
      description: 'Nombre y ubicación de la tienda'
    },
    {
      id: 2,
      title: 'Ubicación Detallada',
      description: 'Dirección, ciudad y zona horaria'
    },
    {
      id: 3,
      title: 'Contacto',
      description: 'Email, teléfono y sitio web'
    }
  ];

  currentStep = signal(0);

  constructor(
    private fb: FormBuilder,
    private storesService: StoresService,
    private centersService: CentersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCenters();
    this.checkEditMode();
  }

  // ============================================
  // 📋 FORM INITIALIZATION
  // ============================================
  
  private initForm(): void {
    this.storeForm = this.fb.group({
      centerId: ['', [Validators.required]],
      storeCode: [''],
      storeName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\s\-]{3,10}$/)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      time_zone: ['UTC', [Validators.required]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]{10,20}$/)]],
      webSite: ['', [this.urlValidator.bind(this)]],
      logo: [''],
    });
  }

  // Validador personalizado para URL opcional
  private urlValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    // Si está vacío, null o undefined, es válido (campo opcional)
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    
    // Si tiene valor, valida que sea una URL correcta
    const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
    if (!urlPattern.test(value)) {
      return { invalidUrl: true };
    }
    
    return null;
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentStoreId.set(parseInt(id, 10));
      this.formState.update(s => ({ ...s, isEditMode: true, isLoading: true }));
      this.loadStore(parseInt(id, 10));
    }
  }

  private loadStore(id: number): void {
    this.storesService.getById(id).subscribe({
      next: (store) => {
        this.storeForm.patchValue(store);
        this.formState.update(s => ({ ...s, isLoading: false }));
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isLoading: false,
          error: err?.error?.message || 'Error cargando la tienda'
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

  // ============================================
  // 🎯 FORM VALIDATION & STEPS
  // ============================================

  canProceedToNextStep(): boolean {
    const step = this.currentStep();
    switch (step) {
      case 0:
        return (this.storeForm.get('centerId')?.valid ?? false);
      case 1:
        return (this.storeForm.get('storeName')?.valid ?? false) && (this.storeForm.get('country')?.valid ?? false);
      case 2:
        return (this.storeForm.get('address')?.valid ?? false) &&
               (this.storeForm.get('city')?.valid ?? false) &&
               (this.storeForm.get('state')?.valid ?? false) &&
               (this.storeForm.get('zipCode')?.valid ?? false);
      case 3:
        return this.storeForm.valid ?? false;
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

  goToStep(stepId: number): void {
    // Permitir navegar a pasos completados (hacia atrás) o al actual
    if (stepId < this.currentStep() || stepId === this.currentStep()) {
      this.currentStep.set(stepId);
    } 
    // Permitir navegar al siguiente paso si valida el paso actual
    else if (stepId === this.currentStep() + 1 && this.canProceedToNextStep()) {
      this.currentStep.set(stepId);
    }
  }

  getStepProgress(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  // ============================================
  // 💾 SAVE & SUBMIT
  // ============================================

  onSubmit(): void {
    if (this.storeForm.invalid) {
      this.markFormGroupTouched(this.storeForm);
      // No mostrar error general, los campos individuales mostrarán sus propios errores
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const storeData = { ...this.storeForm.value };
    
    // Excluir storeCode del envío (es auto-generado y de solo lectura)
    delete storeData.storeCode;
    
    // Convertir webSite y logo vacíos a null
    if (!storeData.webSite || storeData.webSite.trim() === '') {
      storeData.webSite = null;
    }
    if (!storeData.logo || storeData.logo.trim() === '') {
      storeData.logo = null;
    }
    
    const request = this.isEditMode()
      ? this.storesService.update(this.currentStoreId()!, storeData)
      : this.storesService.create(storeData);

    request.subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isSaving: false, success: true }));
        setTimeout(() => {
          this.router.navigate(['/stores']);
        }, 1500);
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isSaving: false,
          error: err?.error?.message || 'Error al guardar la tienda'
        }));
      }
    });
  }

  onCancel(): void {
    if (confirm('¿Descartar cambios?')) {
      this.router.navigate(['/stores']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  // ============================================
  // 🎯 FIELD ERROR HELPERS
  // ============================================

  getFieldError(fieldName: string): string | null {
    const field = this.storeForm.get(fieldName);
    if (!field?.errors || !field?.touched) return null;

    const errors = field.errors;

    // Errores específicos por campo
    if (errors['required']) {
      const fieldLabels: Record<string, string> = {
        centerId: 'Debe seleccionar un centro',
        storeName: 'El nombre de la tienda es requerido',
        country: 'El país es requerido',
        address: 'La dirección es requerida',
        zipCode: 'El código postal es requerido',
        city: 'La ciudad es requerida',
        state: 'El estado/departamento es requerido',
        time_zone: 'La zona horaria es requerida',
        email: 'El email es requerido'
      };
      return fieldLabels[fieldName] || 'Este campo es requerido';
    }

    if (errors['minlength']) {
      return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }

    if (errors['maxlength']) {
      return `No puede exceder ${errors['maxlength'].requiredLength} caracteres`;
    }

    if (errors['email']) {
      return 'Ingrese un email válido (ejemplo@dominio.com)';
    }

    if (errors['invalidUrl']) {
      return 'URL inválida (ej: https://ejemplo.com)';
    }

    if (errors['pattern']) {
      const patternMessages: Record<string, string> = {
        zipCode: 'Código postal inválido (3-10 caracteres alfanuméricos)',
        phoneNumber: 'Formato de teléfono inválido (ej: +57 1 234 5678)',
        webSite: 'URL inválida (ej: https://ejemplo.com)',
        logo: 'URL inválida (ej: https://ejemplo.com/logo.png)'
      };
      return patternMessages[fieldName] || 'Formato inválido';
    }

    return 'Error de validación';
  }

  hasError(fieldName: string): boolean {
    const field = this.storeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
