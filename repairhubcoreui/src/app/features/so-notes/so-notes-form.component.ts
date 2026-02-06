import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SONotes } from '../../shared/models/SONotes';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-so-notes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './so-notes-form.component.html',
})
export class SONotesFormComponent {
  @Input() soNotes: Partial<SONotes> | null = null;
  @Input() serviceOrderId?: number;
  @Input() centerId?: number;
  @Input() storeId?: number;
  @Input() createdById?: number;
  @Input() isModal: boolean = false;
  @Output() save = new EventEmitter<Partial<SONotes>>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  // Data for selects
  centers: Centers[] = [];
  stores: Stores[] = [];
  // UI state
  showCenterField: boolean = true;
  showStoreField: boolean = true;

  constructor(private fb: FormBuilder, private centerService: CentersService,
    private storeService: StoresService, private auth: AuthService) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      serviceOrderId: [null, Validators.required],
      note: [null, Validators.required],
      createdById: [null, Validators.required],

    });
  }

  ngOnChanges() {
    if (this.soNotes) {
      this.form.patchValue(this.soNotes as any);
    }

    // If parent provided serviceOrderId (when creating from parent), ensure the control is set
    if (this.serviceOrderId && !this.form.get('serviceOrderId')?.value) {
      this.form.patchValue({ serviceOrderId: Number(this.serviceOrderId) });
    }
    // patch center/store/createdBy when provided
    if (this.centerId && !this.form.get('centerId')?.value) {
      this.form.patchValue({ centerId: Number(this.centerId) });
    }
    if (this.storeId && !this.form.get('storeId')?.value) {
      this.form.patchValue({ storeId: Number(this.storeId) });
    }
    if (this.createdById && !this.form.get('createdById')?.value) {
      this.form.patchValue({ createdById: Number(this.createdById) });
    }
    // Re-evaluate visibility/defaults when inputs change
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

    // Apply visibility/defaults based on current user
    this.applyUserBasedDefaults();

  }

  private applyUserBasedDefaults() {
    const userType = this.auth.getUserType();

    // Priority: if parent provided a storeId (e.g. client/service order selected), use it
    if (this.storeId) {
      const found = this.stores.find(s => Number(s.id) === Number(this.storeId));
      if (found) {
        // set center according to the store's center (if available)
        const sCenter = (found as any).centerid ?? (found as any).centerId ?? (found as any).center;
        if (sCenter && !this.form.get('centerId')?.value) {
          this.form.get('centerId')?.setValue(Number(sCenter), { emitEvent: false });
        }
        // set store value
        this.form.get('storeId')?.setValue(Number(this.storeId), { emitEvent: false });
        // show store field; center field only for regular `user`
        this.showCenterField = userType === 'user';
        this.showStoreField = true;
        return;
      }
    }

    if (userType === 'user') {
      // Regular users: always show both fields
      this.showCenterField = true;
      this.showStoreField = true;
      return;
    }

    if (userType === 'employee') {
      const emp = this.auth.getCurrentEmployee();
      if (!emp) {
        // fallback: hide center (only visible to 'user'), allow selecting store
        this.showCenterField = false;
        this.showStoreField = true;
        return;
      }

      // Employees: by default hide both center and store and use employee's values
      this.showCenterField = false;
      this.showStoreField = false;

      // set center/store from employee if not already set
      if (!this.form.get('centerId')?.value) {
        this.form.get('centerId')?.setValue(emp.centerId, { emitEvent: false });
      }
      if (!this.form.get('storeId')?.value) {
        this.form.get('storeId')?.setValue(emp.storeId, { emitEvent: false });
      }

      // If employee is center admin, show only store selector (center fixed)
      if (emp.isCenterAdmin) {
        this.showStoreField = true;
        // ensure center is the employee's center (and not editable)
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
}
