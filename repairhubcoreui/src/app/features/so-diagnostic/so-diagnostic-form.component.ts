import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-so-diagnostic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './so-diagnostic-form.component.html',
})
export class SODiagnosticFormComponent {
  @Input() soDiagnostic: Partial<SODiagnostic> | null = null;
  @Input() serviceOrderId?: number;
  @Input() centerId?: number;
  @Input() storeId?: number;
  @Input() createdById?: number;
  @Input() isModal: boolean = false;
  @Input() saving: boolean = false;
  @Output() save = new EventEmitter<Partial<SODiagnostic>>();
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
      diagnostic: [null, Validators.required],
      sendEmail: [false, Validators.required],      
      createdById: [null, Validators.required],
    });
  }

  ngOnChanges() {
    if (this.soDiagnostic) {
      this.form.patchValue(this.soDiagnostic);
    }

    if (this.serviceOrderId && !this.form.get('serviceOrderId')?.value) {
      this.form.patchValue({ serviceOrderId: Number(this.serviceOrderId) });
    }
    if (this.centerId && !this.form.get('centerId')?.value) {
      this.form.patchValue({ centerId: Number(this.centerId) });
    }
    if (this.storeId && !this.form.get('storeId')?.value) {
      this.form.patchValue({ storeId: Number(this.storeId) });
    }
    if (this.createdById != null && !this.form.get('createdById')?.value) {
      this.form.patchValue({ createdById: Number(this.createdById) });
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

    // Apply visibility/defaults based on current user
    this.applyUserBasedDefaults();

  }

  private applyUserBasedDefaults() {
    const userType = this.auth.getUserType();
    const employeeId = this.auth.getEmployeeId();

    if (!this.form.get('createdById')?.value && employeeId) {
      this.form.get('createdById')?.setValue(employeeId, { emitEvent: false });
    }

    // Priority: if parent provided a storeId (e.g. client/service order selected), use it
    if (this.storeId) {
      const found = this.stores.find(s => Number(s.id) === Number(this.storeId));
      if (found) {
        const sCenter = (found as any).centerid ?? (found as any).centerId ?? (found as any).center;
        if (sCenter && !this.form.get('centerId')?.value) {
          this.form.get('centerId')?.setValue(Number(sCenter), { emitEvent: false });
        }
        this.form.get('storeId')?.setValue(Number(this.storeId), { emitEvent: false });
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
        // fallback: hide center (only visible to 'user'), allow selecting store
        this.showCenterField = false;
        this.showStoreField = true;
        return;
      }

      // Employees: by default hide both center and store and use employee's values
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
}
