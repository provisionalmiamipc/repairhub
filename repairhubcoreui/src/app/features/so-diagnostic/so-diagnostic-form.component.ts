import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

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
  @Output() save = new EventEmitter<Partial<SODiagnostic>>();
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
      diagnostic: [null, Validators.required],
      sendEmail: [false, Validators.required],      
      createdById: [null],
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
    if (this.createdById && !this.form.get('createdById')?.value) {
      this.form.patchValue({ createdById: Number(this.createdById) });
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
}
