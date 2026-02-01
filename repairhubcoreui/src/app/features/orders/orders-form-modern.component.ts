import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { Orders } from '../../shared/models/Orders';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Customers } from '../../shared/models/Customers';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { Employees } from '../../shared/models/Employees';
import { OrdersService } from '../../shared/services/orders.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { CustomersService } from '../../shared/services/customers.service';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { EmployeesService } from '../../shared/services/employees.service';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-orders-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-form-modern.component.html',
  styleUrl: './orders-form-modern.component.scss',
})
export class OrdersFormModernComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private customersService = inject(CustomersService);
  private paymentTypesService = inject(PaymentTypesService);
  private employeesService = inject(EmployeesService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  readonly formState = signal<FormState>({
    isLoading: false,
    isSaving: false,
    error: null,
    success: false,
    isEditMode: false,
  });
  readonly currentStep = signal(0);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly customers = signal<Customers[]>([]);
  readonly paymentTypes = signal<PaymentTypes[]>([]);
  readonly employees = signal<Employees[]>([]);

  private destroy$ = new Subject<void>();
  private costChangeSubject = new Subject<void>();

  readonly isLoading = computed(() => this.formState().isLoading);
  readonly isSaving = computed(() => this.formState().isSaving);
  readonly error = computed(() => this.formState().error);
  readonly success = computed(() => this.formState().success);
  readonly isEditMode = computed(() => this.formState().isEditMode);

  orderForm: FormGroup;
  currentOrderId: number | null = null;

  constructor() {
    this.orderForm = this.fb.group({
      // Step 0: Center, Store, Customer
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      customerId: [null, Validators.required],

      // Step 1: Payment & User
      paymentTypeId: [null, Validators.required],
      createdById: [null, Validators.required],

      // Step 2: Costs & Taxes
      totalPrice: [0, [Validators.required, Validators.min(0)]],
      totalCost: [0, [Validators.required, Validators.min(0)]],
      tax: [0, [Validators.min(0)]],
      advancePayment: [0, [Validators.min(0)]],
      note: [''],
      cloused: [false],
      canceled: [false],
    });
  }

  ngOnInit() {
    this.loadData();
    this.setupFormListeners();

    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.currentOrderId = Number(id);
        this.formState.update(s => ({ ...s, isEditMode: true }));
        this.loadOrder(this.currentOrderId);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.formState.update(s => ({ ...s, isLoading: true }));

    Promise.all([
      this.centersService.getAll().toPromise().then(data => this.centers.set(data || [])),
      this.storesService.getAll().toPromise().then(data => this.stores.set(data || [])),
      this.customersService.getAll().toPromise().then(data => this.customers.set(data || [])),
      this.paymentTypesService.getAll().toPromise().then(data => this.paymentTypes.set(data || [])),
      this.employeesService.getAll().toPromise().then(data => this.employees.set(data || [])),
    ])
      .catch(error => {
        this.formState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.formState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private loadOrder(id: number) {
    this.ordersService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (order) => {
        this.orderForm.patchValue({
          centerId: order.center?.id,
          storeId: order.store?.id,
          customerId: order.customer?.id,
          paymentTypeId: order.paymentType?.id,
          createdById: order.createdBy?.id,
          totalPrice: order.totalPrice,
          totalCost: order.totalCost,
          tax: order.tax,
          advancePayment: order.advancePayment,
          note: order.note ? JSON.stringify(order.note) : '',
          cloused: order.cloused,
          canceled: order.canceled,
        });
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, error: 'Error al cargar la orden' }));
      }
    });
  }

  private setupFormListeners() {
    this.orderForm.get('centerId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.orderForm.get('storeId')?.setValue(null);
    });
  }

  get filteredStores() {
    const centerId = this.orderForm.get('centerId')?.value;
    return centerId ? this.stores().filter(s => s.centerId === Number(centerId)) : [];
  }

  canProceedToNextStep(): boolean {
    const controls = this.orderForm.controls;

    if (this.currentStep() === 0) {
      return controls['centerId'].valid && controls['storeId'].valid && controls['customerId'].valid;
    }
    if (this.currentStep() === 1) {
      return controls['paymentTypeId'].valid && controls['createdById'].valid;
    }
    if (this.currentStep() === 2) {
      return controls['totalPrice'].valid && controls['totalCost'].valid;
    }

    return true;
  }

  nextStep() {
    if (this.canProceedToNextStep() && this.currentStep() < 2) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  onSubmit() {
    if (!this.orderForm.valid) {
      this.formState.update(s => ({ ...s, error: 'Por favor completa todos los campos requeridos' }));
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const formValue = this.orderForm.value;
    const payload: Partial<Orders> = {
      ...formValue,
      note: formValue.note ? JSON.parse(formValue.note) : {},
    };

    const request = this.isEditMode() && this.currentOrderId
      ? this.ordersService.update(this.currentOrderId, payload)
      : this.ordersService.create(payload);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.formState.update(s => ({ ...s, success: true, isSaving: false }));
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 1500);
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, error: err.message, isSaving: false }));
      }
    });
  }

  onCancel() {
    if (this.orderForm.dirty && !confirm('¿Descartar cambios?')) {
      return;
    }
    this.router.navigate(['/orders']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.orderForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) {
      return `${fieldName} es requerido`;
    }
    if (field.errors['min']) {
      return `${fieldName} no puede ser menor a ${field.errors['min'].min}`;
    }

    return 'Campo inválido';
  }

  getProgressPercentage(): number {
    return ((this.currentStep() + 1) / 3) * 100;
  }

  getCustomerDisplayName(customer: Customers): string {
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  }
}
