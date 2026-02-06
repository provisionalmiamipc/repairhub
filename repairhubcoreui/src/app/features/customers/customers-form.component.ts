import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Customers, Gender } from '../../shared/models/Customers';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';

@Component({
  selector: 'app-customers-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './customers-form.component.html'
})
export class CustomersFormComponent implements OnInit, OnChanges {
  @Input() customer: Customers | null = null;
  @Input() centers: Centers[] = [];
  @Input() stores: Stores[] = [];
  @Input() role: 'USER' | 'EMPLOYEE' = 'USER';
  @Input() isAdminCenter: boolean = false;
  @Input() employeeCenterId: number | null = null;
  @Input() employeeStoreId: number | null = null;
  @Output() save = new EventEmitter<Customers>();
  @Output() cancel = new EventEmitter<void>();

  centerIdDefault: number | null = null;
  storeIdDefault: number | null = null;

  customerForm!: FormGroup;
  isSubmitting = false;
  backendError: string | null = null;

  // Filtered stores based on selected center
  // Filtered stores based on selected center
  filteredStores: any[] = [];

  genders: Gender[] = ['Male', 'Female'];

  constructor(private fb: FormBuilder) {}

  ngOnChanges() {
    if (this.customer) {
      this.loadCustomerData(this.customer);
    }
  }

  ngOnInit(): void {
    this.initForm();

    // Asignar valores por defecto según el rol
    if (this.role === 'EMPLOYEE') {
      this.centerIdDefault = this.employeeCenterId ?? null;
      this.storeIdDefault = this.employeeStoreId ?? null;
      // Si no es admin center, ambos ocultos y fijos
      if (!this.isAdminCenter) {
        this.customerForm.get('centerId')?.setValue(this.centerIdDefault);
        this.customerForm.get('storeId')?.setValue(this.storeIdDefault);
      } else {
        // Si es admin center, solo centerId fijo y storeId autoseleccionado si existe
        this.customerForm.get('centerId')?.setValue(this.centerIdDefault);
        if (this.storeIdDefault) {
          this.customerForm.get('storeId')?.setValue(this.storeIdDefault);
        }
      }
    }

    // Cuando cambia el center, limpiar storeId
    this.customerForm.get('centerId')?.valueChanges.subscribe(centerId => {
      this.customerForm.get('storeId')?.setValue(null);
      // Si es admin center, autoseleccionar storeId del empleado si corresponde
      if (this.role === 'EMPLOYEE' && this.isAdminCenter && this.employeeStoreId && Number(centerId) === this.employeeCenterId) {
        this.customerForm.get('storeId')?.setValue(this.employeeStoreId);
      }
    });
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      centerId: ["", [Validators.required, Validators.min(1)]],
      storeId: [null, [Validators.required, Validators.min(1)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', [Validators.minLength(2), Validators.maxLength(50)]],
      gender: ['', Validators.required],
      extraInfo: [null, [Validators.maxLength(500)]],
      b2b: [null],
      discount: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  private filterStoresByCenter(centerId: number | null): void {
    if (centerId && this.stores) {
      this.filteredStores = this.stores.filter(store => 
        store.centerId === centerId
      );
    } else {
      this.filteredStores = [];
    }
  }

  get filterStores() {
    const rawCenter = this.customerForm.get('centerId')?.value;
    const centerId = rawCenter !== null && rawCenter !== undefined ? Number(rawCenter) : null;
    if (!centerId) return [];

    return this.filteredStores = this.stores.filter(store => {
      const s: any = store as any;
      const sCenter = s.centerid ?? s.centerId ?? s.center;
      return Number(sCenter) === centerId;
    });
  }

  private loadCustomerData(customer: Customers): void {
    this.customerForm.patchValue({
      centerId: customer.centerId || null,
      storeId: customer.storeId || null,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      gender: customer.gender || null,
      extraInfo: customer.extraInfo,
      b2b: customer.b2b,
      discount: customer.discount
    });

    //this.filterStoresByCenter(customer.centerId);
  }

  onSubmit() {
    if (this.customerForm.valid) {
      this.isSubmitting = true;
      this.backendError = null;
      let formData = this.customerForm.value;
      // Si es EMPLOYEE, forzar centerId al del empleado
      if (this.role === 'EMPLOYEE' && this.employeeCenterId) {
        formData = { ...formData, centerId: this.employeeCenterId };
      }
      // Asegurar que b2b sea booleano
      let b2bValue = formData.b2b;
      if (b2bValue === null || b2bValue === undefined) b2bValue = false;
      else b2bValue = !!b2bValue;
      // Limpiar phone si es string vacío
      let phoneValue = formData.phone;
      if (typeof phoneValue === 'string' && phoneValue.trim() === '') phoneValue = undefined;
      const customerData: Customers = {
        ...formData,
        b2b: b2bValue,
        phone: phoneValue
      };
      // Emitir el objeto y esperar que el padre maneje el error
      try {
        this.save.emit(customerData);
      } catch (err: any) {
        this.backendError = err?.message || 'Error desconocido al guardar.';
      }
    } else {
      this.markFormGroupTouched(this.customerForm);
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

  // Helper methods for template
  get hasStores(): boolean {
    return this.filteredStores.length > 0;
  }

  get storeHelpText(): string {
    if (!this.customerForm.get('centerId')?.value) return 'Please select a center first';
    if (!this.hasStores) return 'No stores available for this center';
    return `${this.filteredStores.length} store(s) available`;
  }

  // Form control getters
  get centerId() { return this.customerForm.get('centerId'); }
  get storeId() { return this.customerForm.get('storeId'); }
  get firstName() { return this.customerForm.get('firstName'); }
  get lastName() { return this.customerForm.get('lastName'); }
  get phone() { return this.customerForm.get('phone'); }
  get email() { return this.customerForm.get('email'); }
  get city() { return this.customerForm.get('city'); }
  get gender() { return this.customerForm.get('gender'); }
  get extraInfo() { return this.customerForm.get('extraInfo'); }
  get b2b() { return this.customerForm.get('b2b'); }
  get discount() { return this.customerForm.get('discount'); }
  
}
