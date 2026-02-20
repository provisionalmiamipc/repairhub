import { Component, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { AuthService } from '../../shared/services/auth.service';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-centers-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './centers-form-modern.component.html',
  styleUrls: ['./centers-form-modern.component.scss'],
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
export class CentersFormModernComponent implements OnInit {
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

  readonly currentCenterId = signal<number | null>(null);
  readonly stores = signal<Stores[]>([]);

  // ============================================
  // 📋 FORM PROPERTIES
  // ============================================
  
  centerForm!: FormGroup;

  isLoading = computed(() => this.formState().isLoading);
  isSaving = computed(() => this.formState().isSaving);
  error = computed(() => this.formState().error);
  success = computed(() => this.formState().success);
  isEditMode = computed(() => this.formState().isEditMode);

  // Campos del formulario
  steps = [
    {
      id: 0,
      title: 'Basic Information',
      description: 'Nombre del centro'
    },
    {
      id: 1,
      title: 'Ubicación',
      description: 'Dirección y zona horaria'
    },
    {
      id: 2,
      title: 'Contacto',
      description: 'Email, teléfono y sitio web'
    }
  ];

  currentStep = signal(0);

  constructor(
    private fb: FormBuilder,
    private centersService: CentersService,
    private storesService: StoresService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadStores();
    this.checkEditMode();
  }

  // ============================================
  // 📋 FORM INITIALIZATION
  // ============================================
  
  private initForm(): void {
    this.centerForm = this.fb.group({
      centerCode: [''],  // Para mostrar en edición (no editable)
      centerName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]{10,}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      time_zone: ['UTC'],
      webSite: ['', [this.urlValidator.bind(this)]],
    });
  }

  /**
   * Validador personalizado para URL
   * Acepta campo vacio o URL valida con o sin protocolo
   */
  private urlValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    // Si esta vacio, es valido
    if (!value || value.trim() === '') {
      return null;
    }
    
    // Regex para URL valida: http(s)://www.example.com o example.com
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/.*)?$/;
    
    if (!urlPattern.test(value)) {
      return { invalidUrl: { value } };
    }
    
    return null;
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentCenterId.set(parseInt(id, 10));
      this.formState.update(s => ({ ...s, isEditMode: true, isLoading: true }));
      this.loadCenter(parseInt(id, 10));
    }
  }

  private loadCenter(id: number): void {
    this.centersService.getById(id).subscribe({
      next: (center) => {
        this.centerForm.patchValue(center);
        this.formState.update(s => ({ ...s, isLoading: false }));
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isLoading: false,
          error: err?.error?.message || 'Error loading center'
        }));
      }
    });
  }

  private loadStores(): void {
    this.storesService.getAll().subscribe({
      next: (data) => this.stores.set(data),
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }

  // ============================================
  // 🔄 FORM SUBMISSION
  // ============================================
  
  onSubmit(): void {
    if (!this.centerForm.valid) {
      this.markFormGroupTouched(this.centerForm);
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const formData = this.centerForm.value;
    
    // Excluir centerCode del envío (no editable)
    delete formData.centerCode;
    
    // Si webSite está vacío, enviar null en lugar de string vacío
    if (!formData.webSite || formData.webSite.trim() === '') {
      formData.webSite = null;
    }
    
    const request = this.isEditMode()
      ? this.centersService.update(this.currentCenterId()!, formData)
      : this.centersService.create(formData);

    request.subscribe({
      next: (response) => {
        this.formState.update(s => ({ ...s, isSaving: false, success: true }));
        setTimeout(() => {
          this.router.navigate(['/centers']);
        }, 1500);
      },
      error: (err) => {
        this.formState.update(s => ({
          ...s,
          isSaving: false,
          error: err?.error?.message || 'Error guardando el centro'
        }));
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/centers']);
  }

  // ============================================
  // 🔧 HELPER METHODS
  // ============================================
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.steps.length) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    const nextStep = this.currentStep() + 1;
    if (nextStep < this.steps.length) {
      this.currentStep.set(nextStep);
    }
  }

  prevStep(): void {
    const prevStep = this.currentStep() - 1;
    if (prevStep >= 0) {
      this.currentStep.set(prevStep);
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.centerForm.get(fieldName);
    if (!control?.errors || !control?.touched) return '';

    const errors = control.errors;
    if (errors['required']) return 'Este campo es requerido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['email']) return 'Email inválido';
    if (errors['pattern']) return 'Formato inválido';
    if (errors['invalidUrl']) return 'URL inválida. Ej: https://www.example.com o example.com';

    return 'Error de validación';
  }

  hasError(fieldName: string): boolean {
    const control = this.centerForm.get(fieldName);
    return !!control && control.invalid && control.touched;
  }

  getProgressPercent(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  clearError(): void {
    this.formState.update(s => ({ ...s, error: null }));
  }
}
