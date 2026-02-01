import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

@Component({
  selector: 'app-repair-status-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './repair-status-form.component.html',
})
export class RepairStatusFormComponent {
  @Input() repairStatus: Partial<RepairStatus> | null = null;
  @Input() serviceOrderIdInput?: number;
  @Input() centerIdInput?: number;
  @Input() storeIdInput?: number;
  @Input() createdByIdInput?: number;
  @Input() isModal: boolean = false;
  @Output() save = new EventEmitter<Partial<RepairStatus>>();
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
      serviceOrderId: [null, Validators.required],
      status: [null, Validators.required],
      createdById: [null],
      
    });
  }

  ngOnChanges() {
    if (this.repairStatus) {
      this.form.patchValue(this.repairStatus);
    }
    if (this.serviceOrderIdInput && !this.form.get('serviceOrderId')?.value) {
      this.form.patchValue({ serviceOrderId: Number(this.serviceOrderIdInput) });
    }
    if (this.centerIdInput && !this.form.get('centerId')?.value) {
      this.form.patchValue({ centerId: Number(this.centerIdInput) });
    }
    if (this.storeIdInput && !this.form.get('storeId')?.value) {
      this.form.patchValue({ storeId: Number(this.storeIdInput) });
    }
    if (this.createdByIdInput && !this.form.get('createdById')?.value) {
      this.form.patchValue({ createdById: Number(this.createdByIdInput) });
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

  get centerId() { return this.form.get('centerId'); }
  get storeId() { return this.form.get('storeId'); }
  get serviceOrderId() { return this.form.get('serviceOrderId'); }
  get status() { return this.form.get('status'); }
  get createdById() { return this.form.get('createdById'); }
}
