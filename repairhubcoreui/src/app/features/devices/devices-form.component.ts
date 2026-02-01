import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Devices } from '../../shared/models/Devices';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { DevicesService } from '../../shared/services/devices.service';

@Component({
  selector: 'app-devices-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './devices-form.component.html',
})
export class DevicesFormComponent {
  @Input() device: Partial<Devices> | null = null;
  @Output() save = new EventEmitter<Devices>();

  // Modal/page mode
  @Input() isModal: boolean = false;
  // Para cerrar modal
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  // Data for selects
  centers: Centers[] = [];
  stores: Stores[] = [];
  //filteredStores: Stores[] = [];

  // States
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private centerService: CentersService,
    private storeService: StoresService, private devicesService: DevicesService) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      name: [null, Validators.required],
      description: [null],
      
    });
  }

  ngOnChanges() {
    if (this.device) {
      this.form.patchValue(this.device);
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
    if (!this.form.valid || this.isLoading) return;

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;
    const payload = this.form.value as Partial<Devices>;

    if (this.device && this.device.id) {
      // Update
      this.devicesService.update(Number(this.device.id), payload).subscribe({
        next: (updated) => {
          this.isLoading = false;
          this.successMessage = 'Device updated successfully.';
          this.save.emit(updated);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.message ?? 'Failed to update device.';
        }
      });
    } else {
      // Create
      this.devicesService.create(payload).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.successMessage = 'Device created successfully.';
          this.save.emit(created);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.message ?? 'Failed to create device.';
        }
      });
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
