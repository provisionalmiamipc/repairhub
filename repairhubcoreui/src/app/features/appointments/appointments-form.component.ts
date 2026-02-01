import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appointments } from '../../shared/models/Appointments';


import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Employees } from '../../shared/models/Employees';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { Devices } from '../../shared/models/Devices';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { EmployeesService } from '../../shared/services/employees.service';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { DevicesService } from '../../shared/services/devices.service';
import { ServiceTypesFormComponent } from '../service-types/service-types-form.component';
import { DevicesFormComponent } from '../devices/devices-form.component';

@Component({
  selector: 'app-appointments-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ServiceTypesFormComponent, DevicesFormComponent],
  templateUrl: './appointments-form.component.html',
})
export class AppointmentsFormComponent implements OnInit, OnChanges {
  @Input() appointment: Appointments | null = null;
  @Output() save = new EventEmitter<Appointments>();
  @Output() cancel = new EventEmitter<void>();

  dateForm!: FormGroup;

  // Mode
  isNew = true;

  // Data for selects
  centers: Centers[] = [];
  stores: Stores[] = [];
  employees: Employees[]= [];
  serviceTypes: ServiceTypes[] = []; 
  devices: Devices[] = []; 

  // Modal control
  showServiceTypeModal = false;
  showDeviceModal = false;

  constructor(private fb: FormBuilder, private centerService: CentersService,
      private storeService: StoresService, private employeeService: EmployeesService,
    private serviceTypeService: ServiceTypesService, private deviceService: DevicesService) {}

  ngOnInit(): void {
    this.dateForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      duration: [15, [Validators.required, Validators.min(10)]],
      notes: [null],
      cloused: [false],
      canceled: [false],
      // Relaciones: se pueden agregar como selectores si se proveen los datos
      centerId: [null, Validators.required],
      customer: [null, Validators.required],
      deviceId: [null, Validators.required],
      createdById: [null, Validators.required],
      serviceTypeId: [null, Validators.required],
      storeId: [null, Validators.required],
    });

    // If we already have an appointment input (parent provided synchronously), patch the form
    this.applyAppointmentToForm();

    this.centerService.getAll().subscribe((c) => (this.centers = c));
    this.storeService.getAll().subscribe((s) => (this.stores = s));
    this.employeeService.getAll().subscribe((e) => (this.employees = e));
    this.serviceTypeService.getAll().subscribe((st) => (this.serviceTypes = st));
    this.deviceService.getAll().subscribe((d) => (this.devices = d));

    // Cuando cambia el center, limpiar storeId
    this.dateForm.get('centerId')?.valueChanges.subscribe(() => {
      this.dateForm.get('storeId')?.setValue(null);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointment']) {
      this.applyAppointmentToForm();
    }
  }

  private applyAppointmentToForm() {
    const a = this.appointment;
    this.isNew = !a || a.id === 0;
    if (!this.dateForm) return;

    if (a) {
      this.dateForm.patchValue({
        date: a.date ?? '',
        time: a.time ?? '',
        duration: a.duration ?? 15,
        notes: a.notes ?? null,
        cloused: a.cloused ?? false,
        canceled: a.canceled ?? false,
        centerId: a.centerId ?? null,
        customer: a.customer ?? null,
        deviceId: a.deviceId ?? null,
        createdById: a.createdById ?? null,
        serviceTypeId: a.serviceTypeId ?? null,
        storeId: a.storeId ?? null,
      });
    } else {
      // reset to defaults for new
      this.dateForm.reset({
        date: '',
        time: '',
        duration: 15,
        notes: null,
        cloused: false,
        canceled: false,
        centerId: null,
        customer: null,
        deviceId: null,
        createdById: null,
        serviceTypeId: null,
        storeId: null,
      });
    }
  }

  get filteredStores() {
    const rawCenter = this.dateForm.get('centerId')?.value;
    const centerId = rawCenter !== null && rawCenter !== undefined ? Number(rawCenter) : null;
    if (!centerId) return [];

    return this.stores.filter(store => {
      const s: any = store as any;
      const sCenter = s.centerid ?? s.centerId ?? s.center;
      return Number(sCenter) === centerId;
    });
  }

  onSubmit() {
    if (this.dateForm.valid) {
      this.save.emit({ ...this.appointment, ...this.dateForm.value });
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  // Modal logic
  openServiceTypeModal() {
    this.showServiceTypeModal = true;
  }
  closeServiceTypeModal() {
    this.showServiceTypeModal = false;
  }
  onServiceTypeCreated(newType: ServiceTypes | Partial<ServiceTypes>) {
    // Reload serviceTypes from server to keep list authoritative
    this.serviceTypeService.getAll().subscribe((st) => {
      this.serviceTypes = st;
      // select the created/updated id if available
      const id = (newType as any).id ?? null;
      this.dateForm.get('serviceTypeId')?.setValue(id as any);
      this.closeServiceTypeModal();
    }, () => {
      // even on error, try to close modal
      const id = (newType as any).id ?? null;
      this.dateForm.get('serviceTypeId')?.setValue(id as any);
      this.closeServiceTypeModal();
    });
  }

  openDeviceModal() {
    this.showDeviceModal = true;
  }
  closeDeviceModal() {
    this.showDeviceModal = false;
  }
  onDeviceCreated(newDevice: Devices | Partial<Devices>) {
    // Reload devices from server to keep list authoritative
    this.deviceService.getAll().subscribe((d) => {
      this.devices = d;
      const id = (newDevice as any).id ?? null;
      this.dateForm.get('deviceId')?.setValue(id as any);
      this.closeDeviceModal();
    }, () => {
      const id = (newDevice as any).id ?? null;
      this.dateForm.get('deviceId')?.setValue(id as any);
      this.closeDeviceModal();
    });
  }
}
