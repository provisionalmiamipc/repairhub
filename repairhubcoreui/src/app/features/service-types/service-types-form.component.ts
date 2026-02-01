import { Component, EventEmitter, Input, Output, OnInit, OnChanges, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-service-types-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-types-form.component.html',
  styleUrls: ['./service-types-form.component.scss']
})
export class ServiceTypesFormComponent implements OnInit, OnChanges {
  @Input() serviceType: Partial<ServiceTypes> | null = null;
  @Output() save = new EventEmitter<ServiceTypes>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private serviceTypesService = inject(ServiceTypesService);
  private authService = inject(AuthService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);

  form: FormGroup;
  centers: Centers[] = [];
  stores: Stores[] = [];
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private userType = signal<string | null>(null);
  isUserTypeUser = computed(() => this.userType() === 'user');

  constructor() {
    this.form = this.fb.group({
      name: [null, Validators.required],
      description: [''],
      centerId: [null],
      storeId: [null]
    });
  }

  get filteredStores(): Stores[] {
    const centerId = this.form.get('centerId')?.value;
    return centerId ? this.stores.filter(s => s.centerId === centerId) : this.stores;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  ngOnChanges() {
    if (this.serviceType) {
      this.form.patchValue(this.serviceType);
    }
  }

  ngOnInit(): void {
    this.loadUserType();
    this.applyUserTypeRules();
    this.centersService.getAll().subscribe((c) => (this.centers = c));
    this.storesService.getAll().subscribe((s) => (this.stores = s));

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });
  }

  private loadUserType(): void {
    this.userType.set(this.authService.getUserType());
  }

  private applyUserTypeRules(): void {
    const userTypeValue = this.authService.getUserType();
    
    if (userTypeValue !== 'user') {
      // Para EMPLOYEE: auto-rellenar desde datos autenticados
      const centerId = this.authService.getCenterId();
      const storeId = this.authService.getStoreId();
      
      if (centerId) this.form.get('centerId')?.setValue(centerId);
      if (storeId) this.form.get('storeId')?.setValue(storeId);
      
      // Deshabilitar campos para que no se editen
      this.form.get('centerId')?.disable();
      this.form.get('storeId')?.disable();
    } else {
      // Para USER: campos requeridos y habilitados
      this.form.get('centerId')?.setValidators([Validators.required]);
      this.form.get('storeId')?.setValidators([Validators.required]);
      this.form.get('centerId')?.updateValueAndValidity();
      this.form.get('storeId')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (!this.form.valid) return;

    if (this.isLoading) return;
    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    // Preparar payload solo con campos necesarios
    const payload: any = {
      name: this.form.value.name,
      description: this.form.value.description || ''
    };

    // Obtener valores reales incluyendo los deshabilitados
    const rawValue = this.form.getRawValue();
    
    // Agregar centerId y storeId solo si está habilitado (para USER) o si es creación
    if (!this.serviceType?.id) {
      // Creación: incluir centerId y storeId si están presentes
      if (this.isUserTypeUser()) {
        if (rawValue.centerId) payload.centerId = rawValue.centerId;
        if (rawValue.storeId) payload.storeId = rawValue.storeId;
      }
    } else {
      // Actualización: solo incluir campos modificables
      // Para EMPLOYEE, centerId y storeId están deshabilitados, no se envían
      if (this.isUserTypeUser()) {
        if (rawValue.centerId) payload.centerId = rawValue.centerId;
        if (rawValue.storeId) payload.storeId = rawValue.storeId;
      }
    }

    if (this.serviceType && this.serviceType.id) {
      this.serviceTypesService.update(Number(this.serviceType.id), payload).subscribe({
        next: (updated) => {
          this.isLoading = false;
          this.successMessage = 'Tipo de servicio actualizado exitosamente.';
          this.save.emit(updated);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message ?? 'Error al actualizar el tipo de servicio.';
          console.error('Update error:', err);
        }
      });
    } else {
      this.serviceTypesService.create(payload).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.successMessage = 'Tipo de servicio creado exitosamente.';
          this.save.emit(created);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message ?? 'Error al crear el tipo de servicio.';
          console.error('Create error:', err);
        }
      });
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
