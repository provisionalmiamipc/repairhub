import {
  Component,
  signal,
  computed,
  OnInit,
  input,
  output,
  effect,
  untracked,
  DestroyRef,
  Injector,
  runInInjectionContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Employees, Gender } from '../../shared/models/Employees';
import { EmployeeType } from '../../shared/models/constants/roles.constants';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { EmployeesService } from '../../shared/services/employees.service';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { AuthService } from '../../shared/services/auth.service';

interface FormState {
  isSubmitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  currentStep: number;
  stepsCompleted: boolean[];
}

@Component({
  selector: 'app-employees-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employees-form-modern.component.html',
  styleUrls: ['./employees-form-modern.component.scss'],
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('stepSlide', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('fieldError', [
      transition(':enter', [
        style({ opacity: 0, height: 0 }),
        animate('200ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0 }))
      ])
    ])
  ]
})
export class EmployeesFormModernComponent implements OnInit {
  // ============================================
  // 🔧 INPUTS
  // ============================================
  employeeInput = input<Employees | null>(null);

  // ============================================
  // 📤 OUTPUTS
  // ============================================
  saveEmployee = output<Partial<Employees>>();
  cancelEdit = output<void>();

  // ============================================
  // 📊 STATE
  // ============================================
  private readonly state = signal<FormState>({
    isSubmitting: false,
    submitSuccess: false,
    submitError: null,
    currentStep: 1,
    stepsCompleted: [false, false, false]
  });

  // ============================================
  // 🎯 COMPUTED
  // ============================================
  isSubmitting = computed(() => this.state().isSubmitting);
  submitSuccess = computed(() => this.state().submitSuccess);
  submitError = computed(() => this.state().submitError);
  currentStep = computed(() => this.state().currentStep);
  stepsCompleted = computed(() => this.state().stepsCompleted);

  private readonly editMode = signal(false);
  private readonly employeeId = signal<number | null>(null);

  private readonly userType = signal<'employee' | 'user' | null>(null);
  private readonly isCenterAdmin = signal(false);
  readonly showCenterAndStoreFields = computed(() => this.userType() === 'user');
  readonly showOnlyStoreField = computed(() => this.userType() === 'employee' && this.isCenterAdmin());
  readonly hideLocationFields = computed(() => this.userType() === 'employee' && !this.isCenterAdmin());

  isEditMode = computed(() => !!this.employeeInput() || this.editMode());
  isStep1Complete = computed(() => {
    this.formValue();
    const form = this.form;
    return (
      form.get('firstName')?.valid &&
      form.get('lastName')?.valid &&
      form.get('gender')?.valid
    );
  });

  isStep2Complete = computed(() => {
    this.formValue();
    const form = this.form;
    return (
      form.get('email')?.valid &&
      form.get('phone')?.valid &&
      form.get('city')?.valid
    );
  });

  isStep3Complete = computed(() => {
    this.formValue();
    const form = this.form;
    return (
      form.get('employee_type')?.valid &&
      form.get('jobTitle')?.valid &&
      form.get('centerId')?.valid &&
      form.get('storeId')?.valid &&
      form.get('pinTimeout')?.valid &&
      form.get('pin')?.valid
    );
  });

  formValid = computed(() => {
    this.formStatus();
    return this.form.valid;
  });
  canGoToStep2 = computed(() => this.isStep1Complete());
  canGoToStep3 = computed(() => this.isStep2Complete());
  canSubmit = computed(() => this.formValid() && !this.isSubmitting());

  // ============================================
  // 🗂️ DATA
  // ============================================
  form!: FormGroup;
  private readonly formStatus = signal<string>('INVALID');
  private readonly formValue = signal<Record<string, unknown>>({});
  genders: Gender[] = ['Male', 'Female'];
  employeeTypes: EmployeeType[] = ['Expert', 'Accountant', 'AdminStore'];
  pinTimeouts = [5, 10, 15, 30, 60];
  centers: Centers[] = [];
  private readonly storesList = signal<Stores[]>([]);
  filteredStores = computed(() => {
    const centerIdRaw = this.formValue()['centerId'] as number | string | null | undefined;
    const centerId = typeof centerIdRaw === 'string' ? Number(centerIdRaw) : centerIdRaw;
    if (!centerId) return [];
    return this.storesList().filter(s => s.centerId === centerId);
  });

  // ============================================
  // 🏗️ CONSTRUCTOR
  // ============================================
  constructor(
    private fb: FormBuilder,
    private centersService: CentersService,
    private storesService: StoresService,
    private employeesService: EmployeesService,
    private authService: AuthService,
    private destroyRef: DestroyRef,
    private injector: Injector,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.createForm();
    this.loadCentersAndStores();
    this.initializeUserType();
    this.initFormSignals();
    this.initFormEffects();
    this.initRouteHandling();
    this.applyUserTypeRules();
  }

  private initRouteHandling(): void {
    this.applyRouteContext();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyRouteContext());
  }

  private applyRouteContext(): void {
    const idParam =
      this.route.snapshot.paramMap.get('id') ??
      this.route.parent?.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.editMode.set(true);
        this.employeeId.set(id);
        this.loadEmployeeForEdit(id);
        return;
      }
    }

    const url = this.router.url || '';
    const editMatch = url.match(/employees\/(\d+)\/edit/);
    if (editMatch?.[1]) {
      const id = Number(editMatch[1]);
      if (!Number.isNaN(id)) {
        this.editMode.set(true);
        this.employeeId.set(id);
        this.loadEmployeeForEdit(id);
        return;
      }
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashMatch = hash.match(/employees\/(\d+)\/edit/);
    if (hashMatch?.[1]) {
      const id = Number(hashMatch[1]);
      if (!Number.isNaN(id)) {
        this.editMode.set(true);
        this.employeeId.set(id);
        this.loadEmployeeForEdit(id);
        return;
      }
    }

    const stateEmployee = history.state?.employee as Employees | undefined;
    if (stateEmployee?.id) {
      this.editMode.set(true);
      this.employeeId.set(stateEmployee.id);
      this.loadEmployeeData(stateEmployee);
      this.formStatus.set(this.form.status);
      this.formValue.set(this.form.getRawValue());
      return;
    }

    this.editMode.set(false);
    this.employeeId.set(null);
  }

  private initFormSignals(): void {
    this.formStatus.set(this.form.status);
    this.formValue.set(this.form.getRawValue());

    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.formStatus.set(status));

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formValue.set(this.form.getRawValue()));

    this.form.get('centerId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(centerId => {
        const storeControl = this.form.get('storeId');
        if (!storeControl) return;
        if (centerId) {
          storeControl.enable({ emitEvent: false });
        } else {
          storeControl.disable({ emitEvent: false });
        }
      });
  }

  private initFormEffects(): void {
    runInInjectionContext(this.injector, () => {
      // Auto-reset storeId cuando cambia centerId
      effect(() => {
        if (this.storesList().length === 0) return;
        const centerIdRaw = this.formValue()['centerId'] as number | string | null | undefined;
        const storeIdRaw = this.formValue()['storeId'] as number | string | null | undefined;
        const centerId = typeof centerIdRaw === 'string' ? Number(centerIdRaw) : centerIdRaw;
        const storeId = typeof storeIdRaw === 'string' ? Number(storeIdRaw) : storeIdRaw;
        if (centerId && storeId) {
          const store = this.storesList().find(s => s.id === storeId);
          if (!store || store.centerId !== centerId) {
            this.form.get('storeId')?.reset();
          }
        }
      });

      // Llenar datos del empleado cuando cambia el input
      effect(() => {
        const employee = this.employeeInput();
        if (employee) {
          untracked(() => this.loadEmployeeData(employee));
          this.formStatus.set(this.form.status);
          this.formValue.set(this.form.getRawValue());
        }
      });
    });
  }

  // ============================================
  // 📋 FORM CREATION
  // ============================================
  private createForm(): void {
    this.form = this.fb.group({
      // Step 1: Personal
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      gender: [null, Validators.required],

      // Step 2: Contact
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,15}$/)]],
      city: ['', [Validators.required, Validators.minLength(2)]],

      // Step 3: Job
      employee_type: ['', Validators.required],
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      centerId: [null, Validators.required],
      storeId: [{ value: null, disabled: true }, Validators.required],
      isCenterAdmin: [false],
      pinTimeout: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
      password: ['', [this.passwordStrengthValidator]]
    });
  }

  private initializeUserType(): void {
    const userType = this.authService.getUserType();
    this.userType.set(userType as 'employee' | 'user' | null);
    const isCenterAdmin = this.authService.getCurrentEmployee()?.isCenterAdmin ?? false;
    this.isCenterAdmin.set(isCenterAdmin);
  }

  private applyUserTypeRules(): void {
    const centerControl = this.form.get('centerId');
    const storeControl = this.form.get('storeId');

    if (this.showCenterAndStoreFields()) {
      centerControl?.setValidators([Validators.required]);
      storeControl?.setValidators([Validators.required]);
      centerControl?.enable({ emitEvent: false });
      storeControl?.enable({ emitEvent: false });
    } else if (this.showOnlyStoreField()) {
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
    if (this.userType() !== 'employee') return;

    const empCenterId = this.authService.getCenterId();
    const empStoreId = this.authService.getStoreId();

    if (empCenterId != null) {
      this.form.get('centerId')?.setValue(empCenterId, { emitEvent: false });
    }

    if (this.showOnlyStoreField()) {
      if (this.form.get('storeId')?.value == null && empStoreId != null) {
        this.form.get('storeId')?.setValue(empStoreId, { emitEvent: false });
      }
    } else if (empStoreId != null) {
      this.form.get('storeId')?.setValue(empStoreId, { emitEvent: false });
    }
  }

  private loadCentersAndStores(): void {
    this.centersService.getAll().subscribe(centers => {
      this.centers = centers;
    });

    this.storesService.getAll().subscribe(stores => {
      this.storesList.set(stores);
    });
  }

  private loadEmployeeData(employee: Employees): void {
    const resolvedCenterId = employee.centerId ?? employee.center?.id ?? null;
    const resolvedStoreId = employee.storeId ?? employee.store?.id ?? null;
    this.form.patchValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      gender: employee.gender,
      email: employee.email,
      phone: employee.phone,
      city: employee.city,
      employee_type: employee.employee_type,
      jobTitle: employee.jobTitle,
      centerId: resolvedCenterId,
      storeId: resolvedStoreId,
      isCenterAdmin: employee.isCenterAdmin,
      pinTimeout: employee.pinTimeout,
      pin: employee.pin
    });
    this.applyEmployeeDefaults();
  }

  private loadEmployeeForEdit(id: number): void {
    this.employeesService
      .getById(id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employee) => {
          this.loadEmployeeData(employee);
          this.formStatus.set(this.form.status);
          this.formValue.set(this.form.getRawValue());
        },
        error: (err) => {
          this.state.update(s => ({
            ...s,
            submitError: err?.message || 'Error cargando el empleado'
          }));
        }
      });
  }

  // ============================================
  // 🚀 NAVIGATION
  // ============================================
  goToStep(step: number): void {
    if (step === 1 || (step === 2 && this.canGoToStep2()) || (step === 3 && this.canGoToStep3())) {
      this.state.update(s => ({ ...s, currentStep: step }));
    }
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current < 3) {
      this.goToStep(current + 1);
    }
  }

  previousStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.goToStep(current - 1);
    }
  }

  // ============================================
  // 💾 SUBMIT
  // ============================================
  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.state.update(s => ({ ...s, isSubmitting: true, submitError: null }));

    const raw = this.form.getRawValue();
    const payload: Partial<Employees> = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      gender: raw.gender,
      email: raw.email,
      phone: raw.phone,
      city: raw.city,
      employee_type: raw.employee_type,
      jobTitle: raw.jobTitle,
      isCenterAdmin: raw.isCenterAdmin,
      pinTimeout: raw.pinTimeout,
      pin: raw.pin,
      password: raw.password
    };
    if (this.showCenterAndStoreFields()) {
      payload.centerId = this.normalizeId(this.form.get('centerId')?.value);
      payload.storeId = this.normalizeId(this.form.get('storeId')?.value);
    } else {
      const empCenterId = this.authService.getCenterId();
      const empStoreId = this.authService.getStoreId();
      payload.centerId = empCenterId ?? undefined;
      if (this.showOnlyStoreField()) {
        payload.storeId = this.normalizeId(this.form.get('storeId')?.value ?? empStoreId);
      } else {
        payload.storeId = empStoreId ?? undefined;
      }
    }
    payload.pinTimeout = this.normalizeNumber(this.form.get('pinTimeout')?.value);
    if (!payload.password) {
      delete payload.password;
    }

    if (payload.centerId === undefined) {
      delete payload.centerId;
    }
    if (payload.storeId === undefined) {
      delete payload.storeId;
    }


    const request$ = this.isEditMode() && this.employeeId()
      ? this.employeesService.update(this.employeeId()!, payload)
      : this.employeesService.create(payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveEmployee.emit(payload);
          this.state.update(s => ({
            ...s,
            isSubmitting: false,
            submitSuccess: true
          }));

          setTimeout(() => {
            this.state.update(s => ({ ...s, submitSuccess: false }));
            this.router.navigate(['/employees']);
          }, 500);
        },
        error: (err) => {
          this.state.update(s => ({
            ...s,
            isSubmitting: false,
            submitError: err?.message || 'Error al guardar el empleado'
          }));
        }
      });
  }

  onCancel(): void {
    this.cancelEdit.emit();
    this.router.navigate(['/employees']);
  }

  // ============================================
  // 🛠️ HELPERS
  // ============================================
  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;
    if (errors['required']) return 'This field is required';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['email']) return 'Invalid email';
    if (errors['pattern']) return 'Invalid format';
    if (errors['min']) return `Minimum value: ${errors['min'].min}`;
    if (errors['max']) return `Maximum value: ${errors['max'].max}`;
    if (errors['passwordStrength']) {
      return 'Password must have 8+ characters, upper, lower, number and symbol.';
    }

    return 'Invalid field';
  }

  private passwordStrengthValidator(control: AbstractControl) {
    const value = (control.value ?? '') as string;
    if (!value) return null;

    const hasMinLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    return hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol
      ? null
      : { passwordStrength: true };
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.valid && field.touched);
  }

  getEmployeeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Expert': 'Expert',
      'Accountant': 'Accountant',
      'AdminStore': 'Store Admin'
    };
    return labels[type] || type;
  }

  getGenderEmoji(gender: string): string {
    return gender === 'Male' ? '👨' : '👩';
  }

  getCenterName(id: number | null): string {
    if (!id) return '';
    return this.centers.find(c => c.id === id)?.centerName || '';
  }

  getStoreName(id: number | null): string {
    if (!id) return '';
    return this.storesList().find(s => s.id === id)?.storeName || '';
  }

  private normalizeId(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private normalizeNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
