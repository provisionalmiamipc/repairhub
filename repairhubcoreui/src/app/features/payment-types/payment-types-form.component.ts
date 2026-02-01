import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';

@Component({
  selector: 'app-payment-types-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-types-form.component.html',
})
export class PaymentTypesFormComponent {
  @Input() paymentType: Partial<PaymentTypes> | null = null;
  @Output() save = new EventEmitter<Partial<PaymentTypes>>();
  // modal/page mode
  @Input() isModal: boolean = false;
  // to close modal when used as modal
  @Output() cancel = new EventEmitter<void>();

  // Data for selects
    centers: Centers[] = [];
    stores: Stores[] = [];

  form: FormGroup;

  constructor(private fb: FormBuilder, private centerService: CentersService,
      private storeService: StoresService) {
    this.form = this.fb.group({
      type: [null, Validators.required],
      description: [''],  
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],    
    });
  }

  ngOnChanges() {
    if (this.paymentType) {
      this.form.patchValue(this.paymentType);
    }
  }

  ngOnInit(): void {

    this.centerService.getAll().subscribe((c) => (this.centers = c));
    this.storeService.getAll().subscribe((s) => (this.stores = s));

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });

  }

  get filteredStores() {
    const rawCenter = this.form.get('centerId')?.value;
    const centerId = rawCenter !== null && rawCenter !== undefined ? Number(rawCenter) : null;
    if (!centerId) return [];

    return this.stores.filter(store => {
      const s: any = store as any;
      const sCenter = s.centerid ?? s.centerId ?? s.center;
      return Number(sCenter) === centerId;
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    if (this.form.valid) {
      const payload = this.form.value as Partial<PaymentTypes>;
      console.log('PaymentTypesForm submit payload:', payload);
      this.save.emit(payload);
    }
  }

  // Form control getters
  get type() { return this.form.get('type'); }
  get description() { return this.form.get('description'); }
  get centerId() { return this.form.get('centerId'); }
  get storeId() { return this.form.get('storeId'); }
}
