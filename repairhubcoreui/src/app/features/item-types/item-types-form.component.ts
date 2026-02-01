import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

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

  constructor(
    private fb: FormBuilder,
    private centersService: CentersService,
    private storesService: StoresService
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
    this.centersService.getAll().subscribe((c) => (this.centers = c || []));
    this.storesService.getAll().subscribe((s) => (this.stores = s || []));

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

