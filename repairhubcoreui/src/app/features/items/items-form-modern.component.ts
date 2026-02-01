import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Items } from '../../shared/models/Items';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { ItemsService } from '../../shared/services/items.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ItemTypesService } from '../../shared/services/item-types.service';

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
  styleUrl: './items-form-modern.component.scss',
})
export class ItemsFormModernComponent implements OnInit, OnDestroy {
  private itemsService = inject(ItemsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private itemTypesService = inject(ItemTypesService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

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

  private destroy$ = new Subject<void>();
  private costChangeSubject = new Subject<void>();

  readonly isLoading = computed(() => this.formState().isLoading);
  readonly isSaving = computed(() => this.formState().isSaving);
  readonly error = computed(() => this.formState().error);
  readonly success = computed(() => this.formState().success);
  readonly isEditMode = computed(() => this.formState().isEditMode);

  // Form definitions
  itemForm: FormGroup;
  currentItemId: number | null = null;

  constructor() {
    this.itemForm = this.fb.group({
      // Step 0: Center & Store & Type
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
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
  }

  ngOnInit() {
    this.loadData();
    this.setupFormListeners();

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
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, error: 'Error al cargar el artículo' }));
      }
    });
  }

  private setupFormListeners() {
    // Listen for center changes to clear store
    this.itemForm.get('centerId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.itemForm.get('storeId')?.setValue(null);
    });
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
      return controls['centerId'].valid && controls['storeId'].valid && controls['itemTypeId'].valid;
    }
    if (this.currentStep() === 1) {
      return controls['product'].valid && controls['sku'].valid && controls['price'].valid && controls['cost'].valid && controls['stock'].valid;
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
    const payload: Partial<Items> = {
      ...formValue,
      specs: formValue.specs ? JSON.parse(formValue.specs) : {},
    };

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
        this.formState.update(s => ({ ...s, error: err.message, isSaving: false }));
      }
    });
  }

  onCancel() {
    if (this.itemForm.dirty && !confirm('¿Descartar cambios?')) {
      return;
    }
    this.router.navigate(['/items']);
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
}
