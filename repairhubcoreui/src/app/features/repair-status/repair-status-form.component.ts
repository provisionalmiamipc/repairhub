import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { AuthService } from '../../shared/services/auth.service';

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
  @Input() saving: boolean = false;
  @Output() save = new EventEmitter<Partial<RepairStatus>>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  // Data for selects
    centers: Centers[] = [];
    stores: Stores[] = [];
  // UI state
  showCenterField: boolean = true;
  showStoreField: boolean = true;
  // Status picker
  showStatusPicker: boolean = false;
  statusOptions: { label: string; icon: string }[] = [
    { label: 'Pending', icon: 'bi bi-clock' },
    { label: 'Repaired', icon: 'bi bi-check2-circle' },
    { label: 'In Progress', icon: 'bi bi-hourglass-split' },
    { label: 'Awaiting Parts', icon: 'bi bi-box-seam' },
    { label: 'Waiting on customer', icon: 'bi bi-person' },
    { label: 'Shipped', icon: 'bi bi-truck' },
    { label: 'Delivered', icon: 'bi bi-box-arrow-in-right' },
    { label: 'Picked up', icon: 'bi bi-bag-check' },
    { label: 'Tech Damage', icon: 'bi bi-tools' },
    { label: 'Paid', icon: 'bi bi-currency-dollar' },
    { label: 'Cancel Repair', icon: 'bi bi-x-circle' },
    { label: 'Canceled by customer', icon: 'bi bi-person-x' },
    { label: 'Non Repairable', icon: 'bi bi-exclamation-triangle' },
  ];

  constructor(private fb: FormBuilder, private centerService: CentersService,
      private storeService: StoresService, private auth: AuthService) {
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
    this.applyUserBasedDefaults();
  }

  ngOnInit(): void {  
    
    
    this.centerService.getAll().subscribe((c) => {
      this.centers = c;
      this.applyUserBasedDefaults();
    });
    this.storeService.getAll().subscribe((s) => {
      this.stores = s;
      this.applyUserBasedDefaults();
    });

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });

    this.applyUserBasedDefaults();

  }

  openStatusPicker() {
    this.showStatusPicker = true;
  }

  selectStatus(option: { label: string; icon: string }) {
    this.form.get('status')?.setValue(option.label);
    this.showStatusPicker = false;
  }

  private applyUserBasedDefaults() {
    const userType = this.auth.getUserType();

    // Priority: if parent provided a storeId (e.g. client/service order selected), use it
    if (this.storeIdInput) {
      const found = this.stores.find(s => Number(s.id) === Number(this.storeIdInput));
      if (found) {
        const sCenter = (found as any).centerid ?? (found as any).centerId ?? (found as any).center;
        if (sCenter && !this.form.get('centerId')?.value) {
          this.form.get('centerId')?.setValue(Number(sCenter), { emitEvent: false });
        }
        this.form.get('storeId')?.setValue(Number(this.storeIdInput), { emitEvent: false });
        // show store field; center only visible to regular users
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
        this.showCenterField = false;
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
