import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { CommonModule } from '@angular/common';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

@Component({
  selector: 'app-device-brands-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './device-brands-form.component.html',
})
export class DeviceBrandsFormComponent {
  @Input() deviceBrand: Partial<DeviceBrands> | null = null;
  @Output() save = new EventEmitter<Partial<DeviceBrands>>();

  // Modal/page mode
  @Input() isModal: boolean = false;
  // Para cerrar modal
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;

  // Data for selects
  centers: Centers[] = [];
  stores: Stores[] = [];

  constructor(private fb: FormBuilder, private centerService: CentersService,
    private storeService: StoresService) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      name: ['', Validators.required],
      img: [''],
      description: [''],
    });
  }

  ngOnChanges() {
    if (this.deviceBrand) {
      this.form.patchValue({
        centerId: this.deviceBrand.centerId,
        storeId: this.deviceBrand.storeId,
        name: this.deviceBrand.name,
        img: this.deviceBrand.img,
        description: this.deviceBrand.description,
      });
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

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  get centerId() { return this.form.get('centerId'); }
  get storeId() { return this.form.get('storeId'); }
  get name() { return this.form.get('name'); }
  get img() { return this.form.get('img'); }
  get description() { return this.form.get('description'); }
}
