import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Employees, Gender} from '../../shared/models/Employees';

import { ReactiveFormsModule } from '@angular/forms';
import { 
  CardComponent, 
  CardHeaderComponent, 
  CardBodyComponent, 
  SpinnerComponent, 
  FormFeedbackComponent,
  FormControlDirective,
  FormSelectDirective,
  FormCheckComponent,
  FormCheckInputDirective,
  ButtonDirective,
  ColComponent,
  FormCheckLabelDirective,
} from '@coreui/angular';
import { JsonPipe } from '@angular/common';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { AuthService } from '../../shared/services/auth.service';
import { take } from 'rxjs/operators';
import { EmployeesService } from '../../shared/services/employees.service';
import { map, debounceTime, switchMap, first } from 'rxjs/operators';
import { of } from 'rxjs';
import { StoresService } from '../../shared/services/stores.service';
import { EmployeeType } from '../../shared/models/constants/roles.constants';

@Component({
  selector: 'app-employees-form',
  standalone: true,
  imports: [ReactiveFormsModule, CardComponent, 
  CardHeaderComponent, SpinnerComponent,
  CardBodyComponent, FormFeedbackComponent, FormControlDirective,
  FormCheckComponent, FormCheckInputDirective, FormSelectDirective, ButtonDirective, ColComponent,
  FormCheckLabelDirective ],
  templateUrl: './employees-form.component.html',
})
export class EmployeesFormComponent implements OnInit {
  @Input() employee: Employees | null = null;
  centers: Centers[] = [];
  stores: Stores[] = [];
  @Output() save = new EventEmitter<Employees>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;

  genders: Gender[] = ['Male', 'Female'];
  employee_types: EmployeeType[] = ['Expert', 'Accountant', 'AdminStore'];
  pinTimeouts = [5, 10, 15, 30, 60];
  userType: 'employee' | 'user' | null = null;
  isCenterAdmin = false;

  constructor(private fb: FormBuilder, private centersService: CentersService, 
    private storesService: StoresService, private employeesService: EmployeesService,
    private authService: AuthService) {
    this.form = this.createForm();
  }

  ngOnChanges() {

    if (this.employee) {
      this.loadEmployeeData(this.employee);
    }

  }

  ngOnInit(): void {
    /*this.form = this.fb.group({
      firstName: [this.employee?.firstName || '', Validators.required],
      lastName: [this.employee?.lastName || '', Validators.required],
      email: [this.employee?.email || '', [Validators.required, Validators.email]],
      // Agrega más campos según tu modelo
    });*/
    
    
    this.centersService.getAll().subscribe((c) => (this.centers = c));
    this.storesService.getAll().subscribe((s) => (this.stores = s));

    // Determine user type and apply visibility rules
    this.userType = this.authService.getUserType() as 'employee' | 'user' | null;
    this.isCenterAdmin = this.authService.getCurrentEmployee()?.isCenterAdmin ?? false;

    this.applyUserTypeRules();

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });

  }

  private applyUserTypeRules() {
    // For USER: show both center and store
    // For EMPLOYEE (non-admin): hide both and prefill with auth employee center/store
    // For EMPLOYEE admin: show only store, prefill center and select store list for that center
    if (this.userType === 'user') {
      this.form.get('centerId')?.setValidators([Validators.required]);
      this.form.get('storeId')?.setValidators([Validators.required]);
      this.form.get('centerId')?.enable({ emitEvent: false });
      this.form.get('storeId')?.enable({ emitEvent: false });
    } else if (this.userType === 'employee' && this.isCenterAdmin) {
      // center fixed, store selectable
      const centerId = this.authService.getCenterId();
      if (centerId != null) {
        this.form.get('centerId')?.setValue(centerId, { emitEvent: false });
      }
      this.form.get('centerId')?.disable({ emitEvent: false });
      this.form.get('storeId')?.setValidators([Validators.required]);
      this.form.get('storeId')?.enable({ emitEvent: false });
    } else if (this.userType === 'employee') {
      // employee not admin: hide both and set defaults from auth
      const centerId = this.authService.getCenterId();
      const storeId = this.authService.getStoreId();
      if (centerId != null) this.form.get('centerId')?.setValue(centerId, { emitEvent: false });
      if (storeId != null) this.form.get('storeId')?.setValue(storeId, { emitEvent: false });
      this.form.get('centerId')?.disable({ emitEvent: false });
      this.form.get('storeId')?.disable({ emitEvent: false });
    }

    this.form.get('centerId')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('storeId')?.updateValueAndValidity({ emitEvent: false });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      gender: [null, Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)], [this.uniquePhoneValidator()]],
      email: ['', [Validators.required, Validators.email], [this.uniqueEmailValidator()]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      employee_type: [null, Validators.required],
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      isCenterAdmin: [false],
      // `pin` and `pinTimeout` are optional: backend puede generarlos si se dejan en blanco
      pinTimeout: [null, [Validators.min(0), Validators.max(120)]],
      pin: ['', [Validators.pattern(/^[0-9]{4,6}$/)]],
      password: [],// ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private loadEmployeeData(employee: Employees): void {
    this.form.patchValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      gender: employee.gender,
      phone: employee.phone,
      email: employee.email,
      city: employee.city,
      employee_type: employee.employee_type,
      jobTitle: employee.jobTitle,
      centerId: employee.centerId,
      storeId: employee.storeId,
      isCenterAdmin: employee.isCenterAdmin,
      pinTimeout: employee.pinTimeout,
      pin: employee.pin,
      password: ''
    });
  }

  private uniqueEmailValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return of(null);
      return of(value).pipe(
        debounceTime(300),
        switchMap(email => this.employeesService.getAll()),
        map(list => {
          const exists = list.some((e: any) => e.email === value && e.id !== this.employee?.id);
          return exists ? { emailTaken: true } : null;
        }),
        first()
      );
    };
  }

  private uniquePhoneValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return of(null);
      return of(value).pipe(
        debounceTime(300),
        switchMap(phone => this.employeesService.getAll()),
        map(list => {
          const exists = list.some((e: any) => e.phone === value && e.id !== this.employee?.id);
          return exists ? { phoneTaken: true } : null;
        }),
        first()
      );
    };
  }

  onSubmit() {
    if (this.form.valid) {
      this.isSubmitting = true;

      const raw = this.form.getRawValue();
      const payload: any = {
        firstName: raw.firstName,
        lastName: raw.lastName,
        gender: raw.gender,
        email: raw.email,
        phone: raw.phone,
        city: raw.city,
        employee_type: raw.employee_type,
        jobTitle: raw.jobTitle,
        isCenterAdmin: raw.isCenterAdmin,
        pinTimeout: this.normalizeNumber(raw.pinTimeout),
        pin: raw.pin,
        password: raw.password
      };

      const center = this.normalizeNumber(this.form.get('centerId')?.value);
      const store = this.normalizeNumber(this.form.get('storeId')?.value);

      if (center !== undefined) payload.centerId = center;
      if (store !== undefined) payload.storeId = store;
      if (!payload.password) delete payload.password;
      // Ensure pinTimeout is always sent on create: default to 5 minutes when missing
      if (payload.pinTimeout === undefined || payload.pinTimeout === null) {
        payload.pinTimeout = 5;
      }
      if (!payload.pin) delete payload.pin;

      this.save.emit(payload);
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  private normalizeNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get filteredStores() {
    const rawCenter = this.form.get('centerId')?.value;
    const centerId = rawCenter !== null && rawCenter !== undefined ? Number(rawCenter) : null;
    if (!centerId) return [];

    return this.stores.filter(store => {
      const s: any = store as any;
      const sCenter = s.centerid ?? s.centerId ?? s.center;
      return Number(sCenter) === centerId;
    });
  }

  // Getters para el template
  get firstName() { return this.form.get('firstName'); }
  get lastName() { return this.form.get('lastName'); }
  get gender() { return this.form.get('gender'); }
  get phone() { return this.form.get('phone'); }
  get email() { return this.form.get('email'); }
  get city() { return this.form.get('city'); }
  get employee_type() { return this.form.get('employee_type'); }
  get jobTitle() { return this.form.get('jobTitle'); }
  get centerId() { return this.form.get('centerId'); }
  get storeId() { return this.form.get('storeId'); }
  get pinTimeout() { return this.form.get('pinTimeout'); }
  get pin() { return this.form.get('pin'); }
  get password() { return this.form.get('password'); }

  showCenterAndStoreFields() {
    return this.userType === 'user';
  }

  showOnlyStoreField() {
    return this.userType === 'employee' && this.isCenterAdmin;
  }

  hideLocationFields() {
    return this.userType === 'employee' && !this.isCenterAdmin;
  }
}
