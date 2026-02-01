import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Sales } from '../../shared/models/Sales';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Customers } from '../../shared/models/Customers';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { Employees } from '../../shared/models/Employees';
import { SalesService } from '../../shared/services/sales.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { CustomersService } from '../../shared/services/customers.service';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { EmployeesService } from '../../shared/services/employees.service';

interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-sales-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sales-form-modern.component.html',
  styleUrl: './sales-form-modern.component.scss',
})
export class SalesFormModernComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesService = inject(SalesService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private customersService = inject(CustomersService);
  private paymentTypesService = inject(PaymentTypesService);
  private employeesService = inject(EmployeesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly formState = signal<FormState>({ isLoading: false, error: null, success: false, isEditMode: false });
  readonly currentStep = signal(0);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly customers = signal<Customers[]>([]);
  readonly paymentTypes = signal<PaymentTypes[]>([]);
  readonly employees = signal<Employees[]>([]);

  saleForm!: FormGroup;
  saleId: number | null = null;

  private destroy$ = new Subject<void>();

  readonly filteredStores = computed(() => {
    const centerId = this.saleForm?.get('centerId')?.value;
    if (!centerId) return [];
    return this.stores().filter(store => store.centerId === Number(centerId));
  });

  readonly progressPercentage = computed(() => {
    return ((this.currentStep() + 1) / 3) * 100;
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
    this.saleForm = this.fb.group({
      // Step 0: Centro, Tienda, Cliente
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      customerId: [null, Validators.required],

      // Step 1: Pago, Usuario
      paymentTypeId: [null, Validators.required],
      createdById: [null, Validators.required],

      // Step 2: Costos, Descuento, Estado
      totalCost: ['', [Validators.required, Validators.min(0)]],
      totalPrice: [0, [Validators.required, Validators.min(0)]],
      totalDiscount: [0, [Validators.required, Validators.min(0)]],
      cloused: [false],
      canceled: [false],
    });

    this.saleForm.get('centerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.saleForm.patchValue({ storeId: null });
      });
  }

  private loadAllData() {
    this.formState.update(s => ({ ...s, isLoading: true }));

    Promise.all([
      this.loadCenters(),
      this.loadStores(),
      this.loadCustomers(),
      this.loadPaymentTypes(),
      this.loadEmployees(),
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

  private loadCustomers() {
    return this.customersService.getAll().toPromise().then(data => {
      this.customers.set(data || []);
    });
  }

  private loadPaymentTypes() {
    return this.paymentTypesService.getAll().toPromise().then(data => {
      this.paymentTypes.set(data || []);
    });
  }

  private loadEmployees() {
    return this.employeesService.getAll().toPromise().then(data => {
      this.employees.set(data || []);
    });
  }

  private checkEditMode() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.saleId = Number(id);
        this.formState.update(s => ({ ...s, isEditMode: true }));
        this.loadSaleData(this.saleId);
      }
    });
  }

  private loadSaleData(id: number) {
    this.formState.update(s => ({ ...s, isLoading: true }));
    this.salesService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sale) => {
          this.saleForm.patchValue({
            centerId: sale.center?.id || null,
            storeId: sale.store?.id || null,
            customerId: sale.customer?.id || null,
            paymentTypeId: sale.paymentType?.id || null,
            createdById: sale.createdBy?.id || null,
            totalCost: sale.totalCost || '',
            totalPrice: sale.totalPrice || 0,
            totalDiscount: sale.totalDiscount || 0,
            cloused: sale.cloused || false,
            canceled: sale.canceled || false,
          });
          this.formState.update(s => ({ ...s, isLoading: false }));
        },
        error: (err) => {
          this.formState.update(s => ({ ...s, isLoading: false, error: err.message }));
        }
      });
  }

  nextStep() {
    if (this.canProceedToNextStep()) {
      this.currentStep.update(step => Math.min(step + 1, 2));
    }
  }

  previousStep() {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();

    if (step === 0) {
      const centerId = this.saleForm.get('centerId');
      const storeId = this.saleForm.get('storeId');
      const customerId = this.saleForm.get('customerId');
      return !!centerId?.valid && !!storeId?.valid && !!customerId?.valid;
    }

    if (step === 1) {
      const paymentTypeId = this.saleForm.get('paymentTypeId');
      const createdById = this.saleForm.get('createdById');
      return !!paymentTypeId?.valid && !!createdById?.valid;
    }

    return this.saleForm.valid;
  }

  getCustomerFullName(customer: Customers): string {
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  }

  getEmployeeFullName(employee: Employees): string {
    return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  }

  onSubmit() {
    if (!this.saleForm.valid) {
      Object.keys(this.saleForm.controls).forEach(key => {
        this.saleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.formState.update(s => ({ ...s, isLoading: true, error: null }));

    const saleData: Partial<Sales> = this.saleForm.value;

    const request$ = this.formState().isEditMode && this.saleId
      ? this.salesService.update(this.saleId, saleData)
      : this.salesService.create(saleData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isLoading: false, success: true }));
        setTimeout(() => this.router.navigate(['/sales']), 1500);
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, isLoading: false, error: err.message }));
      }
    });
  }

  cancel() {
    this.router.navigate(['/sales']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.saleForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.saleForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;

    return 'Campo inválido';
  }
}
