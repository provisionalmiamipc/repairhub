import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customers, Gender } from '../../shared/models/Customers';
import { CommonModule } from '@angular/common';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

// CoreUI Standalone Imports
import { 
  CardComponent, 
  CardHeaderComponent, 
  CardBodyComponent,   
  SpinnerComponent,
  FormFeedbackComponent,
  FormCheckComponent,
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective, 
  FormSelectDirective,
  FormCheckLabelDirective,
  FormCheckInputDirective,
  InputGroupComponent,
  
  
} from '@coreui/angular';

@Component({
  selector: 'app-customers-form',
  templateUrl: './customers-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    FormControlDirective,
    FormLabelDirective,
    FormCheckComponent,
    FormFeedbackComponent,
    ButtonDirective,
    SpinnerComponent,
    InputGroupComponent,
    FormSelectDirective,
    FormCheckLabelDirective,
    FormCheckInputDirective,
    
    
  ]
})
export class CustomersFormComponent implements OnInit {
  @Input() customer: Customers | null = null;  
  @Input() centers: Centers[] = [];
  @Input() stores: Stores[] = [];
  @Output() save = new EventEmitter<Customers>();
  @Output() cancel = new EventEmitter<void>();

  customerForm!: FormGroup;
  isSubmitting = false;
  //centers: Centers[] = [];
  //stores: Stores[] = [];

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

    console.log('El customer es: ', this.customer);

    

    // Cuando cambia el center, limpiar storeId
    this.customerForm.get('centerId')?.valueChanges.subscribe(() => {
      this.customerForm.get('storeId')?.setValue(null);
    });
    
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      centerId: ["", [Validators.required, Validators.min(1)]],
      storeId: [null, [Validators.required, Validators.min(1)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      gender: ['', Validators.required],
      extraInfo: [null, [Validators.maxLength(500)]],
      b2b: [false],
      discount: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  private filterStoresByCenter(centerId: number | null): void {
    console.log('El centerId es:', centerId );
    console.log('los Stores son:', this.stores)
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
      
      const formData = this.customerForm.value;
      const customerData: Customers = {
        ...formData,
        //id: this.customer?.id,
        //createdAt: this.customer?.createdAt || new Date(),
        //updatedAt: new Date()
      };

      this.save.emit(customerData);
    } else {
      this.markFormGroupTouched(this.customerForm);
    }
    /*if (this.customerForm.valid) {
      this.save.emit({ ...this.customer, ...this.customerForm.value });
    }*/
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
