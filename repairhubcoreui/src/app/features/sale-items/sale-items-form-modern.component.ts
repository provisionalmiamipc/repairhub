import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SaleItems } from '../../shared/models/SaleItems';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Items } from '../../shared/models/Items';
import { Sales } from '../../shared/models/Sales';
import { SaleItemsService } from '../../shared/services/sale-items.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ItemsService } from '../../shared/services/items.service';
import { SalesService } from '../../shared/services/sales.service';

interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  isEditMode: boolean;
}

@Component({
  selector: 'app-sale-items-form-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sale-items-form-modern.component.html',
  styleUrl: './sale-items-form-modern.component.scss',
})
export class SaleItemsFormModernComponent implements OnInit {
  private fb = inject(FormBuilder);
  private saleItemsService = inject(SaleItemsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private itemsService = inject(ItemsService);
  private salesService = inject(SalesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly formState = signal<FormState>({ isLoading: false, error: null, success: false, isEditMode: false });
  readonly currentStep = signal(0);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly items = signal<Items[]>([]);
  readonly sales = signal<Sales[]>([]);

  saleItemForm!: FormGroup;
  saleItemId: number | null = null;

  private destroy$ = new Subject<void>();

  readonly filteredStores = computed(() => {
    const centerId = this.saleItemForm?.get('centerId')?.value;
    if (!centerId) return [];
    return this.stores().filter(store => store.centerId === Number(centerId));
  });

  readonly progressPercentage = computed(() => {
    return ((this.currentStep() + 1) / 2) * 100;
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
    this.saleItemForm = this.fb.group({
      // Step 0: Venta, Centro, Tienda, Item
      saleId: [null, Validators.required],
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      itemId: [null, Validators.required],

      // Step 1: Cantidad, Precios, Descuento
      quantity: [1, [Validators.required, Validators.min(1)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
    });

    this.saleItemForm.get('centerId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.saleItemForm.patchValue({ storeId: null });
      });
  }

  private loadAllData() {
    this.formState.update(s => ({ ...s, isLoading: true }));

    Promise.all([
      this.loadCenters(),
      this.loadStores(),
      this.loadItems(),
      this.loadSales(),
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

  private loadItems() {
    return this.itemsService.getAll().toPromise().then(data => {
      this.items.set(data || []);
    });
  }

  private loadSales() {
    return this.salesService.getAll().toPromise().then(data => {
      this.sales.set(data || []);
    });
  }

  private checkEditMode() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.saleItemId = Number(id);
        this.formState.update(s => ({ ...s, isEditMode: true }));
        this.loadSaleItemData(this.saleItemId);
      }
    });
  }

  private loadSaleItemData(id: number) {
    this.formState.update(s => ({ ...s, isLoading: true }));
    this.saleItemsService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (saleItem) => {
          this.saleItemForm.patchValue({
            saleId: saleItem.sale?.id || null,
            centerId: saleItem.center?.id || null,
            storeId: saleItem.store?.id || null,
            itemId: saleItem.item?.id || null,
            quantity: saleItem.quantity || 1,
            cost: saleItem.cost || 0,
            price: saleItem.price || 0,
            discount: saleItem.discount || 0,
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
      this.currentStep.update(step => Math.min(step + 1, 1));
    }
  }

  previousStep() {
    this.currentStep.update(step => Math.max(step - 1, 0));
  }

  canProceedToNextStep(): boolean {
    const step = this.currentStep();

    if (step === 0) {
      const saleId = this.saleItemForm.get('saleId');
      const centerId = this.saleItemForm.get('centerId');
      const storeId = this.saleItemForm.get('storeId');
      const itemId = this.saleItemForm.get('itemId');
      return !!saleId?.valid && !!centerId?.valid && !!storeId?.valid && !!itemId?.valid;
    }

    return this.saleItemForm.valid;
  }

  onSubmit() {
    if (!this.saleItemForm.valid) {
      Object.keys(this.saleItemForm.controls).forEach(key => {
        this.saleItemForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.formState.update(s => ({ ...s, isLoading: true, error: null }));

    const saleItemData: Partial<SaleItems> = this.saleItemForm.value;

    const request$ = this.formState().isEditMode && this.saleItemId
      ? this.saleItemsService.update(this.saleItemId, saleItemData)
      : this.saleItemsService.create(saleItemData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.formState.update(s => ({ ...s, isLoading: false, success: true }));
        setTimeout(() => this.router.navigate(['/sale-items']), 1500);
      },
      error: (err) => {
        this.formState.update(s => ({ ...s, isLoading: false, error: err.message }));
      }
    });
  }

  cancel() {
    this.router.navigate(['/sale-items']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.saleItemForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.saleItemForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;

    return 'Campo inválido';
  }
}
