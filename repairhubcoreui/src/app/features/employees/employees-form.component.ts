import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  constructor(private fb: FormBuilder, private centersService: CentersService, 
    private storesService: StoresService) {
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

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });

  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      gender: [null, Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      employee_type: [null, Validators.required],
      jobTitle: ['', [Validators.required, Validators.minLength(2)]],
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      isCenterAdmin: [false],
      pinTimeout: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
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

  onSubmit() {
    /*if (this.form.valid) {
      this.save.emit({ ...this.employee, ...this.form.value });
    }*/

      if (this.form.valid) {
      this.isSubmitting = true;
      this.save.emit(this.form.value);
    } else {
      this.markFormGroupTouched(this.form);
    }
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
}
