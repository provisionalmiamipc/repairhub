import { Component, OnInit, OnDestroy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { Items } from '../../shared/models/Items';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { ItemsService } from '../../shared/services/items.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ItemTypesService } from '../../shared/services/item-types.service';
import { AuthService } from '../../shared/services/auth.service';

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-items-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items-form-modern.component.html',
  //styleUrl: './items-form-modern.component.scss',
  animations: [
    trigger('slideInFrom', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class ItemsFormModernComponent implements OnInit, OnDestroy {
  private itemsService = inject(ItemsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private itemTypesService = inject(ItemTypesService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // State signals
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
  readonly itemTypes = signal<ItemTypes[]>([]);
  readonly showItemTypeModal = signal(false);
  readonly isCreatingItemType = signal(false);
  readonly itemTypeError = signal<string | null>(null);

  // RBAC signals
  readonly currentUserType = signal<'user' | 'employee' | null>(null);
  readonly currentEmployee = computed(() => this.authService.getCurrentEmployee());
  readonly isCenterAdmin = computed(() => this.currentEmployee()?.isCenterAdmin ?? false);
  readonly employeeCenterId = computed(() => this.currentEmployee()?.centerId ?? null);
  readonly employeeStoreId = computed(() => this.currentEmployee()?.storeId ?? null);

  readonly showCenterAndStoreFields = computed(() => this.currentUserType() === 'user');
  readonly showOnlyStoreField = computed(() =>
    this.currentUserType() === 'employee' && this.isCenterAdmin()
  );
  readonly hideLocationFields = computed(() =>
    this.currentUserType() === 'employee' && !this.isCenterAdmin()
  );

  private destroy$ = new Subject<void>();
  private costChangeSubject = new Subject<void>();

  readonly isLoading = computed(() => this.formState().isLoading);
  readonly isSaving = computed(() => this.formState().isSaving);
  readonly error = computed(() => this.formState().error);
  readonly success = computed(() => this.formState().success);
  readonly isEditMode = computed(() => this.formState().isEditMode);

  // Form definitions
  itemForm: FormGroup;
  itemTypeForm: FormGroup;
  currentItemId: number | null = null;

  constructor() {
    this.itemForm = this.fb.group({
      // Step 0: Center & Store & Type
      centerId: [null],
      storeId: [null],
      itemTypeId: [null, Validators.required],

      // Step 1: Basic Info & Prices & Stock
      product: ['', Validators.required],
      sku: ['', Validators.required],
      shortTitleDesc: [''],
      barcode: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minimunStock: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      warranty: [0, [Validators.min(0)]],
      taxable: [false],
      isActive: [true],
      specs: [''],
      image: [''],
    });

    this.itemTypeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isActive: [true],
    });
  }

  ngOnInit() {
    this.initializeUserType();
    this.loadData();
    this.setupFormListeners();
    this.applyUserTypeRules();

    this.authService.employee$
      .pipe(takeUntil(this.destroy$))
      .subscribe(employee => {
        if (employee) {
          this.currentUserType.set('employee');
          this.applyUserTypeRules();
        }
      });

    // Check if edit mode
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.currentItemId = Number(id);
        this.formState.update(s => ({ ...s, isEditMode: true }));
        this.loadItem(this.currentItemId);
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
      this.itemTypesService.getAll().toPromise().then(data => this.itemTypes.set(data || [])),
    ])
      .catch(error => {
        this.formState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.formState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private initializeUserType(): void {
    const userType = this.authService.getUserType();
    if (userType) {
      this.currentUserType.set(userType as 'user' | 'employee');
      return;
    }

    if (this.authService.getCurrentEmployee()) {
      this.currentUserType.set('employee');
      return;
    }

    this.currentUserType.set('user');
  }

  private applyUserTypeRules(): void {
    const isUserType = this.currentUserType() === 'user';
    const isEmployee = this.currentUserType() === 'employee';
    const isAdminCenterEmployee = isEmployee && this.isCenterAdmin();

    const centerControl = this.itemForm.get('centerId');
    const storeControl = this.itemForm.get('storeId');

    if (isUserType) {
      centerControl?.setValidators([Validators.required]);
      storeControl?.setValidators([Validators.required]);
    } else if (isAdminCenterEmployee) {
      centerControl?.clearValidators();
      storeControl?.setValidators([Validators.required]);

      const empCenterId = this.employeeCenterId();
      const empStoreId = this.employeeStoreId();
      if (empCenterId) {
        centerControl?.setValue(empCenterId, { emitEvent: false });
      }
      if (empStoreId) {
        storeControl?.setValue(empStoreId, { emitEvent: false });
      }
    } else if (isEmployee) {
      centerControl?.clearValidators();
      storeControl?.clearValidators();

      const empCenterId = this.employeeCenterId();
      const empStoreId = this.employeeStoreId();
      if (empCenterId) {
        centerControl?.setValue(empCenterId, { emitEvent: false });
      }
      if (empStoreId) {
        storeControl?.setValue(empStoreId, { emitEvent: false });
      }
    }

    centerControl?.updateValueAndValidity({ emitEvent: false });
    storeControl?.updateValueAndValidity({ emitEvent: false });
  }

  private loadItem(id: number) {
    this.itemsService.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (item) => {
        const centerId = (item as any).centerId ?? (item as any).centerid;
        const storeId = (item as any).storeId ?? (item as any).storeid;
        this.itemForm.patchValue({
          centerId: centerId != null ? Number(centerId) : null,
          storeId: storeId != null ? Number(storeId) : null,
          itemTypeId: item.itemTypeId,
          product: item.product,
          sku: item.sku,
          shortTitleDesc: item.shortTitleDesc,
          barcode: item.barcode,
          price: item.price,
          cost: item.cost,
          stock: item.stock,
          minimunStock: item.minimunStock,
          discount: item.discount,
          warranty: item.warranty,
          taxable: item.taxable,
          isActive: item.isActive,
          specs: item.specs ? JSON.stringify(item.specs) : '',
          image: item.image,
        });

        this.applyUserTypeRulesForEdit();
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, error: 'Error al cargar el artículo' }));
      }
    });
  }

  private setupFormListeners() {
    // Listen for center changes to clear store (solo USER)
    this.itemForm.get('centerId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.showCenterAndStoreFields()) {
        this.itemForm.get('storeId')?.setValue(null);
      }
    });
  }

  private applyUserTypeRulesForEdit(): void {
    if (this.currentUserType() !== 'employee') {
      return;
    }

    const centerControl = this.itemForm.get('centerId');
    const storeControl = this.itemForm.get('storeId');

    const empCenterId = this.employeeCenterId();
    const empStoreId = this.employeeStoreId();

    if (empCenterId) {
      centerControl?.setValue(empCenterId, { emitEvent: false });
    }

    if (this.showOnlyStoreField()) {
      if (empStoreId) {
        storeControl?.setValue(empStoreId, { emitEvent: false });
      }
    } else {
      if (empStoreId) {
        storeControl?.setValue(empStoreId, { emitEvent: false });
      }
    }
  }

  get filteredStores() {
    const centerId = this.itemForm.get('centerId')?.value;
    return centerId
      ? this.stores().filter(s => {
          const storeCenterId = (s as any).centerId ?? (s as any).centerid;
          return Number(storeCenterId) === Number(centerId);
        })
      : [];
  }

  canProceedToNextStep(): boolean {
    const controls = this.itemForm.controls;

    if (this.currentStep() === 0) {
      if (this.showCenterAndStoreFields()) {
        return controls['centerId'].valid && controls['storeId'].valid;
      }
      if (this.showOnlyStoreField()) {
        return controls['storeId'].valid;
      }
      return true;
    }
    if (this.currentStep() === 1) {
      return controls['itemTypeId'].valid
        && controls['product'].valid
        && controls['sku'].valid
        && controls['price'].valid
        && controls['cost'].valid
        && controls['stock'].valid;
    }

    return true;
  }

  nextStep() {
    if (this.canProceedToNextStep() && this.currentStep() < 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  onSubmit() {
    if (!this.itemForm.valid) {
      this.formState.update(s => ({ ...s, error: 'Por favor completa todos los campos requeridos' }));
      return;
    }

    this.formState.update(s => ({ ...s, isSaving: true, error: null }));

    const formValue = this.itemForm.value;
    const centerId = this.currentUserType() === 'employee'
      ? (this.employeeCenterId() ?? formValue.centerId)
      : formValue.centerId;
    const storeId = this.currentUserType() === 'employee'
      ? (this.employeeStoreId() ?? formValue.storeId)
      : formValue.storeId;

    if (centerId == null || storeId == null) {
      this.formState.update(s => ({ ...s, error: 'Selecciona centro y tienda antes de guardar.', isSaving: false }));
      return;
    }

    let parsedSpecs: object = {};
    if (formValue.specs) {
      try {
        parsedSpecs = JSON.parse(formValue.specs);
      } catch {
        this.formState.update(s => ({ ...s, error: 'Las especificaciones no tienen un JSON válido.', isSaving: false }));
        return;
      }
    }

    const payload: Partial<Items> & {
      centerId: number;
      storeId: number;
      itemTypeId: number | null;
    } = {
      ...formValue,
      centerId: Number(centerId),
      storeId: Number(storeId),
      itemTypeId: formValue.itemTypeId != null ? Number(formValue.itemTypeId) : null,
      price: Number(formValue.price),
      cost: Number(formValue.cost),
      stock: Number(formValue.stock),
      minimunStock: Number(formValue.minimunStock),
      discount: Number(formValue.discount ?? 0),
      warranty: Number(formValue.warranty ?? 0),
      taxable: !!formValue.taxable,
      isActive: !!formValue.isActive,
      specs: parsedSpecs,
    };

    // Aplicar RBAC para empleados
    if (this.currentUserType() === 'employee') {
      const empCenterId = this.employeeCenterId();
      const empStoreId = this.employeeStoreId();

      if (empCenterId != null) {
        payload.centerId = Number(empCenterId);
      }

      if (this.showOnlyStoreField()) {
        payload.storeId = payload.storeId || Number(empStoreId);
      } else {
        payload.storeId = Number(empStoreId);
      }
    }

    const request = this.isEditMode() && this.currentItemId
      ? this.itemsService.update(this.currentItemId, payload)
      : this.itemsService.create(payload);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.formState.update(s => ({ ...s, success: true, isSaving: false }));
        setTimeout(() => {
          this.router.navigate(['/items']);
        }, 1500);
      },
      error: (err) => {
        const apiMessage = this.getApiErrorMessage(err);
        this.formState.update(s => ({ ...s, error: apiMessage ?? 'Error al guardar el artículo', isSaving: false }));
      }
    });
  }

  onCancel() {
    if (this.itemForm.dirty && !confirm('¿Descartar cambios?')) {
      return;
    }
    this.router.navigate(['/items']);
  }

  openItemTypeModal(): void {
    this.itemTypeError.set(null);
    this.itemTypeForm.reset({ name: '', description: '', isActive: true });
    this.showItemTypeModal.set(true);
  }

  closeItemTypeModal(): void {
    if (this.isCreatingItemType()) {
      return;
    }
    this.showItemTypeModal.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showItemTypeModal()) {
      this.closeItemTypeModal();
    }
  }

  createItemType(): void {
    if (this.itemTypeForm.invalid) {
      this.itemTypeForm.markAllAsTouched();
      return;
    }

    const centerId = this.itemForm.get('centerId')?.value ?? this.employeeCenterId();
    const storeId = this.itemForm.get('storeId')?.value ?? this.employeeStoreId();

    if (centerId == null || storeId == null) {
      this.itemTypeError.set('Selecciona centro y tienda antes de crear el tipo.');
      return;
    }

    this.isCreatingItemType.set(true);
    this.itemTypeError.set(null);

    const payload = {
      ...this.itemTypeForm.value,
      centerId: Number(centerId),
      storeId: Number(storeId),
    };
    this.itemTypesService.create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          const updated = [...this.itemTypes(), created].sort((a, b) => a.name.localeCompare(b.name));
          this.itemTypes.set(updated);
          this.itemForm.get('itemTypeId')?.setValue(created.id);
          this.showItemTypeModal.set(false);
          this.itemTypeForm.reset({ name: '', description: '', isActive: true });
          this.isCreatingItemType.set(false);
        },
        error: (err) => {
          this.itemTypeError.set(this.getApiErrorMessage(err) ?? 'Error al crear el tipo de artículo');
          this.isCreatingItemType.set(false);
        }
      });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.itemForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) {
      return `${fieldName} es requerido`;
    }
    if (field.errors['min']) {
      return `${fieldName} no puede ser menor a ${field.errors['min'].min}`;
    }
    if (field.errors['max']) {
      return `${fieldName} no puede ser mayor a ${field.errors['max'].max}`;
    }

    return 'Campo inválido';
  }

  getProgressPercentage(): number {
    return ((this.currentStep() + 1) / 2) * 100;
  }

  private getApiErrorMessage(err: any): string | null {
    const message = err?.error?.message ?? err?.message;
    if (Array.isArray(message)) {
      return message.join(' | ');
    }
    if (typeof message === 'string') {
      return message;
    }
    return null;
  }
}
