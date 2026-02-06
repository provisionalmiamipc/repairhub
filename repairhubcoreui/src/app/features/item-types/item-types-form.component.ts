import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-item-types-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-types-form.component.html',
})
export class ItemTypesFormComponent {
  @Input() itemType: Partial<ItemTypes> | null = null;
  @Input() centerId?: number;
  @Input() storeId?: number;
  @Output() save = new EventEmitter<Partial<ItemTypes>>();

  form: FormGroup;
  centers: Centers[] = [];
  stores: Stores[] = [];
  isSubmitting = false;
  showCenterField: boolean = true;
  showStoreField: boolean = true;

  constructor(
    private fb: FormBuilder,
    private centersService: CentersService,
    private storesService: StoresService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      name: [null, Validators.required],
      description: [''],
      isActive: [true, Validators.required],
    });
  }

  ngOnInit(): void {
    this.centersService.getAll().subscribe((c) => { this.centers = c || []; this.applyUserBasedDefaults(); });
    this.storesService.getAll().subscribe((s) => { this.stores = s || []; this.applyUserBasedDefaults(); });

    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });
  }

  ngOnChanges() {
    if (this.itemType) {
      this.form.patchValue(this.itemType);
    }

    if (this.centerId && !this.form.get('centerId')?.value) {
      this.form.patchValue({ centerId: Number(this.centerId) });
    }
    if (this.storeId && !this.form.get('storeId')?.value) {
      this.form.patchValue({ storeId: Number(this.storeId) });
    }
    this.applyUserBasedDefaults();
  }

  private applyUserBasedDefaults() {
    const userType = this.auth.getUserType();

    // If parent provided a storeId, prioritize it
    if (this.storeId) {
      const found = this.stores.find(s => Number(s.id) === Number(this.storeId));
      if (found) {
        const sCenter = (found as any).centerid ?? (found as any).centerId ?? (found as any).center;
        if (sCenter && !this.form.get('centerId')?.value) {
          this.form.get('centerId')?.setValue(Number(sCenter), { emitEvent: false });
        }
        this.form.get('storeId')?.setValue(Number(this.storeId), { emitEvent: false });
        this.showCenterField = userType === 'user';
        this.showStoreField = true;
        return;
      }
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

      this.showCenterField = false;
      this.showStoreField = false;

      if (!this.form.get('centerId')?.value) {
        this.form.get('centerId')?.setValue(emp.centerId, { emitEvent: false });
      }
      if (!this.form.get('storeId')?.value) {
        this.form.get('storeId')?.setValue(emp.storeId, { emitEvent: false });
      }

      if (emp.isCenterAdmin) {
        this.showStoreField = true;
        this.form.get('centerId')?.setValue(emp.centerId, { emitEvent: false });
      }
    }
  }

  get filteredStores() {
    const centerId = this.form.get('centerId')?.value;
    if (!centerId) return [];
    return this.stores.filter(s => Number((s as any).centerid ?? (s as any).centerId ?? (s as any).center) === Number(centerId));
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.save.emit(this.form.value);
    // Reset the submitting flag after a short delay to allow parent component to process
    setTimeout(() => {
      this.isSubmitting = false;
    }, 1000);
  }
}

