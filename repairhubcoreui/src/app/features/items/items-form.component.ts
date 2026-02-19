import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Items } from '../../shared/models/Items';
import { CommonModule } from '@angular/common';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { CentersService } from '../../shared/services/centers.service';
import { AuthService } from '../../shared/services/auth.service';
import { StoresService } from '../../shared/services/stores.service';
import { ItemTypesService } from '../../shared/services/item-types.service';
import { ItemsService } from '../../shared/services/items.service';
import { ItemTypesFormComponent } from '../item-types/item-types-form.component';

@Component({
  selector: 'app-items-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ItemTypesFormComponent],
  templateUrl: './items-form.component.html',
})
export class ItemsFormComponent {
  @Input() item: Items | null = null;
  @Output() save = new EventEmitter<Partial<Items>>();
  form: FormGroup;
  // UI state for center/store visibility
  showCenterField: boolean = true;
  showStoreField: boolean = true;
  centers: Centers[] = [];
  stores: Stores[] = [];
  itemTypes: ItemTypes[] = [];
  showItemTypeModal = false;
  isCreatingType = false;
  isSaving = false;
  typeCreatedMessage = '';
  typeCreateError = '';
  saveMessage = '';
  saveError = '';

  constructor(
    private fb: FormBuilder,
    private centersService: CentersService,
    private storesService: StoresService,
    private itemTypesService: ItemTypesService,
    private itemsService: ItemsService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      itemTypeId: [null, Validators.required],
      product: ['', Validators.required],
      sku: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      shortTitleDesc: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      minimunStock: [0, [Validators.required, Validators.min(0)]],
      specs: [''],
      image: [''],
      barcode: [''],
      taxable: [false],
      warranty: [0, [Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.centersService.getAll().subscribe((c) => { this.centers = c || []; this.applyUserBasedDefaults(); });
    this.storesService.getAll().subscribe((s) => { this.stores = s || []; this.applyUserBasedDefaults(); });
    this.loadItemTypes();

    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });
  }

  ngOnChanges() {
    if (this.item) {
      this.form.patchValue({
        centerId: this.item.centerid,
        storeId: this.item.storeid,
        itemTypeId: this.item.itemTypeId,
        product: this.item.product,
        sku: this.item.sku,
        price: this.item.price,
        cost: this.item.cost,
        shortTitleDesc: this.item.shortTitleDesc,
        stock: this.item.stock,
        minimunStock: this.item.minimunStock,
        specs: this.item.specs,
        image: this.item.image,
        barcode: this.item.barcode,
        taxable: this.item.taxable,
        warranty: this.item.warranty,
        discount: this.item.discount,
        isActive: this.item.isActive,
      });
        this.applyUserBasedDefaults();
    }
  }

    private applyUserBasedDefaults() {
      const userType = this.auth.getUserType();

      if (this.item && this.item.id) {
        // editing existing item: leave values as-is
        return;
      }

      if (userType === 'user') {
        this.showCenterField = true;
        this.showStoreField = true;
        return;
      }

      if (userType === 'employee') {
        const emp = this.auth.getCurrentEmployee();
        if (!emp) {
          this.showCenterField = true;
          this.showStoreField = true;
          return;
        }

        // Default: hide both and set values from employee
        this.showCenterField = false;
        this.showStoreField = false;

        if (!this.form.get('centerId')?.value) {
          this.form.get('centerId')?.setValue(emp.centerId, { emitEvent: false });
        }
        if (!this.form.get('storeId')?.value) {
          this.form.get('storeId')?.setValue(emp.storeId, { emitEvent: false });
        }

        // If employee is center admin, show only store selector and fix center to employee center
        if (emp.isCenterAdmin) {
          this.showStoreField = true;
          this.form.get('centerId')?.setValue(emp.centerId, { emitEvent: false });
        }
      }
    }

  private loadItemTypes() {
    this.itemTypesService.getAll().subscribe((t) => (this.itemTypes = t || []));
  }

  get filteredStores() {
    const centerId = this.form.get('centerId')?.value;
    if (!centerId) return [];
    return this.stores.filter(s => Number((s as any).centerid ?? (s as any).centerId ?? (s as any).center) === Number(centerId));
  }

  openItemTypeModal() {
    this.showItemTypeModal = true;
  }

  closeItemTypeModal() {
    this.showItemTypeModal = false;
  }

  onItemTypeSaved(payload: Partial<ItemTypes>) {
    this.isCreatingType = true;
    this.typeCreateError = '';
    this.itemTypesService.create(payload).subscribe({
      next: (created) => {
        this.isCreatingType = false;
        this.closeItemTypeModal();
        this.loadItemTypes();
        this.form.patchValue({ itemTypeId: created.id });
        this.typeCreatedMessage = 'Item type created and selected.';
        setTimeout(() => {
          this.typeCreatedMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.isCreatingType = false;
        this.typeCreateError = err?.message || 'Failed to create item type. Please try again.';
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Please fill in all required fields';
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    
    const payload = { ...this.form.value };
    
    if (this.item?.id) {
      // Update existing item
      this.itemsService.update(this.item.id, payload).subscribe({
        next: (updated) => {
          this.isSaving = false;
          this.saveMessage = 'Item saved successfully';
          setTimeout(() => {
            this.saveMessage = '';
            this.save.emit(updated);
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError = err?.error?.message || 'Failed to save item. Please try again.';
        }
      });
    } else {
      // Create new item
      this.itemsService.create(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.saveMessage = 'Item created successfully';
          setTimeout(() => {
            this.saveMessage = '';
            this.save.emit(created);
            // Reset form but preserve defaults according to user type
            const userType = this.auth.getUserType();
            let defaultCenter: any = null;
            let defaultStore: any = null;
            if (userType === 'employee') {
              const emp = this.auth.getCurrentEmployee();
              if (emp) {
                defaultCenter = emp.centerId ?? null;
                defaultStore = emp.storeId ?? null;
              }
            }
            this.form.reset({
              centerId: defaultCenter,
              storeId: defaultStore,
              itemTypeId: null,
              taxable: false,
              isActive: true,
              discount: 0,
              price: 0,
              cost: 0,
              stock: 0,
              minimunStock: 0
            });
            this.applyUserBasedDefaults();
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError = err?.error?.message || 'Failed to create item. Please try again.';
        }
      });
    }
  }
}

