import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { CommonModule } from '@angular/common';
import { SONotes } from '../../shared/models/SONotes';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { SOItems } from '../../shared/models/SOItems';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { SONotesService } from '../../shared/services/so-notes.service';
import { SODiagnosticService } from '../../shared/services/so-diagnostic.service';
import { SOItemsService } from '../../shared/services/so-items.service';
import { RepairStatusService } from '../../shared/services/repair-status.service';
import { SONotesFormComponent } from '../so-notes/so-notes-form.component';
import { SODiagnosticFormComponent } from '../so-diagnostic/so-diagnostic-form.component';
import { SOItemsFormComponent } from '../so-items/so-items-form.component';
import { RepairStatusFormComponent } from '../repair-status/repair-status-form.component';
// ToastsComponent used globally in AppComponent
import { ToastService } from '../../shared/services/toast.service';
import { DevicesFormComponent } from '../devices/devices-form.component';
import { DeviceBrandsFormComponent } from '../device-brands/device-brands-form.component';
import { PaymentTypesFormComponent } from '../payment-types/payment-types-form.component';
import { CustomerSearchComponent } from '../customers/customer-search.component';
import { CustomersService } from '../../shared/services/customers.service';
import { DevicesService } from '../../shared/services/devices.service';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { EmployeesService } from '../../shared/services/employees.service';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-service-orders-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SONotesFormComponent, SODiagnosticFormComponent, SOItemsFormComponent, RepairStatusFormComponent, DevicesFormComponent, DeviceBrandsFormComponent, PaymentTypesFormComponent, CustomerSearchComponent],
  templateUrl: './service-orders-form.component.html',
})
export class ServiceOrdersFormComponent {
  @Input() serviceOrder: ServiceOrders | null = null;
  @Output() save = new EventEmitter<Partial<ServiceOrders>>();
  // Events to open modals in parent or handle related actions
  @Output() addSONote = new EventEmitter<number | null>();
  @Output() editSONote = new EventEmitter<SONotes>();
  @Output() addSODiagnostic = new EventEmitter<number | null>();
  @Output() editSODiagnostic = new EventEmitter<SODiagnostic>();
  @Output() addSOItem = new EventEmitter<number | null>();
  @Output() editSOItem = new EventEmitter<SOItems>();
  @Output() addRepairStatus = new EventEmitter<number | null>();
  @Output() editRepairStatus = new EventEmitter<RepairStatus>();
  form: FormGroup;
  // related lists (local cache)
  soNotes: SONotes[] = [];
  soDiagnostics: SODiagnostic[] = [];
  soItems: SOItems[] = [];
  repairStatuses: RepairStatus[] = [];
  // modal controls
  showNoteModal = false;
  showDiagnosticModal = false;
  showItemModal = false;
  showStatusModal = false;
  // local toggles for accordion sections (avoid dependency on Bootstrap JS)
  showNotesCollapse = false;
  showDiagnosticsCollapse = false;
  showStatusesCollapse = false;
  showItemsCollapse = false;
  // Data for selects
  centers: Centers[] = [];
  stores: Stores[] = [];
  customers: any[] = [];
  devices: any[] = [];
  deviceBrands: any[] = [];
  paymentTypes: any[] = [];
  employees: any[] = [];

  // editing models for modals
  editingNote: Partial<SONotes> | null = null;
  editingDiagnostic: Partial<SODiagnostic> | null = null;
  editingItem: Partial<SOItems> | null = null;
  editingStatus: Partial<RepairStatus> | null = null;

  // modals for select children
  showDeviceModal = false;
  showDeviceBrandModal = false;
  showPaymentTypeModal = false;
  showCustomerSearch = false;

  editingDevice: Partial<any> | null = null;
  editingDeviceBrand: Partial<any> | null = null;
  editingPaymentType: Partial<any> | null = null;


  // toasts: using global ToastService instead of local array

  constructor(private fb: FormBuilder,
    private soNotesService: SONotesService,
    private soDiagnosticService: SODiagnosticService,
    private soItemsService: SOItemsService,
    private repairStatusService: RepairStatusService,
    private centerService: CentersService,
    private storeService: StoresService,
    private toastService: ToastService,
    private customersService: CustomersService,
    private devicesService: DevicesService,
    private deviceBrandsService: DeviceBrandsService,
    private paymentTypesService: PaymentTypesService,
    private employeesService: EmployeesService,
    private router: Router,
    private route: ActivatedRoute) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      customerId: [null, Validators.required],
      deviceId: [null, Validators.required],
      deviceBrandId: [null, Validators.required],
      paymentTypeId: [null, Validators.required],
      assignedTechId: [null, Validators.required],
      createdById: [null, Validators.required],
      model: ['', Validators.required],
      defectivePart: [''],
      serial: [''],
      lock: [false],
      price: [0, [Validators.required, Validators.min(0)]],
      repairCost: [0, [Validators.required, Validators.min(0)]],
      totalCost: [0, [Validators.required, Validators.min(0)]],
      costdiscount: [0, [Validators.min(0)]],
      advancePayment: [0, [Validators.min(0)]],
      tax: [0, [Validators.min(0)]],
      noteReception: [''],
      cloused: [false],
      canceled: [false],
    });
  }

  ngOnInit(): void {

    this.centerService.getAll().subscribe((c) => (this.centers = c));
    this.storeService.getAll().subscribe((s) => (this.stores = s));

    // load selects
    this.customersService.getAll().subscribe(c => this.customers = c);
    this.devicesService.getAll().subscribe(d => this.devices = d);
    this.deviceBrandsService.getAll().subscribe(b => this.deviceBrands = b);
    // ensure payment types loaded
    this.paymentTypesService.getAll().subscribe(p => this.paymentTypes = p);
    this.employeesService.getAll().subscribe(e => this.employees = e);

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });

    this.form.valueChanges.pipe(
    debounceTime(300)
  ).subscribe(values => {
    const total = (values.price || 0) + 
                  (values.repairCost || 0) - 
                  (values.costdiscount || 0) + 
                  (values.tax || 0);
    this.form.patchValue({ totalCost: total }, { emitEvent: false });
  });

  }

  openCustomerSearch() {
    this.showCustomerSearch = true;
  }

  closeCustomerSearch() {
    this.showCustomerSearch = false;
  }

  onCustomerSelected(c: any) {
    if (c && (c as any).id) {
      this.form.get('customerId')?.setValue((c as any).id);
      // reload customers list in case it's necessary
      this.customersService.getAll().subscribe(cs => this.customers = cs);
      this.toastService.success('Cliente seleccionado');
    }
    this.closeCustomerSearch();
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

  // open/close helpers for modals
  openAddNote() { this.editingNote = { createdAt: new Date() as any }; this.showNoteModal = true; }
  openEditNote(n: SONotes) { this.editingNote = n; this.showNoteModal = true; }
  closeNoteModal() { this.editingNote = null; this.showNoteModal = false; }

  openAddDiagnostic() { this.editingDiagnostic = { createdAt: new Date() as any }; this.showDiagnosticModal = true; }
  openEditDiagnostic(d: SODiagnostic) { this.editingDiagnostic = d; this.showDiagnosticModal = true; }
  closeDiagnosticModal() { this.editingDiagnostic = null; this.showDiagnosticModal = false; }

  openAddItem() { this.editingItem = { serviceOrderId: this.serviceOrder?.id ?? undefined, createdAt: new Date() as any, updatedAt: new Date() as any }; this.showItemModal = true; }
  openEditItem(it: SOItems) { this.editingItem = it; this.showItemModal = true; }
  closeItemModal() { this.editingItem = null; this.showItemModal = false; }

  openAddStatus() { this.editingStatus = { createdAt: new Date() as any }; this.showStatusModal = true; }
  openEditStatus(r: RepairStatus) { this.editingStatus = r; this.showStatusModal = true; }
  closeStatusModal() { this.editingStatus = null; this.showStatusModal = false; }

  // handlers when modal child emits save
  onNoteSaved(payload: Partial<SONotes>) {
    const id = (this.editingNote as SONotes)?.id;
    // sanitize payload: only allow primitive ids and scalar fields expected by backend
    const p = payload as SONotes;
    const sanitized: Partial<SONotes> = {
      centerId: p.centerId !== null && p.centerId !== undefined ? Number(p.centerId) : undefined,
      storeId: p.storeId !== null && p.storeId !== undefined ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId !== null && p.serviceOrderId !== undefined ? Number(p.serviceOrderId) : undefined,
      note: p.note,      
      createdById: p.createdById !== null && p.createdById !== undefined ? Number(p.createdById) : undefined,
    };

    if (id) {
      this.soNotesService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeNoteModal(); this.toastService.success('Note updated'); },
        error: (err) => { this.toastService.error('Error updating note'); }
      });
    } else {
      this.soNotesService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeNoteModal(); this.toastService.success('Note created'); },
        error: (err) => { console.error('Error creating note', err); this.toastService.error('Error creating note'); }
      });
    }
  }

  // device/deviceBrand/paymentType modals
  openAddDevice() { this.editingDevice = { name: '', centerId: this.form.get('centerId')?.value ?? null }; this.showDeviceModal = true; }
  openEditDevice(d: any) { this.editingDevice = d; this.showDeviceModal = true; }
  closeDeviceModal() { this.editingDevice = null; this.showDeviceModal = false; }

  openAddDeviceBrand() { this.editingDeviceBrand = { name: '', centerId: this.form.get('centerId')?.value ?? null }; this.showDeviceBrandModal = true; }
  openEditDeviceBrand(b: any) { this.editingDeviceBrand = b; this.showDeviceBrandModal = true; }
  closeDeviceBrandModal() { this.editingDeviceBrand = null; this.showDeviceBrandModal = false; }

  openAddPaymentType() { this.editingPaymentType = { type: null, createdAt: new Date() as any }; this.showPaymentTypeModal = true; }
  openEditPaymentType(p: any) { this.editingPaymentType = p; this.showPaymentTypeModal = true; }
  closePaymentTypeModal() { this.editingPaymentType = null; this.showPaymentTypeModal = false; }

  onDeviceSaved(payload: Partial<any>) {
    // If child already returned the created/updated object (has id), don't call API again.
    const emittedId = (payload as any)?.id;
    const editingId = (this.editingDevice as any)?.id;

    if (emittedId) {
      // child already created/updated and returned the full object
      this.devicesService.getAll().subscribe(d => this.devices = d);
      this.form.get('deviceId')?.setValue(emittedId);
      this.closeDeviceModal();
      this.toastService.success('Device saved');
      return;
    }

    // fallback: child emitted raw payload (no id) so parent should call API
    if (editingId) {
      this.devicesService.update(editingId, payload).subscribe({ next: () => { this.devicesService.getAll().subscribe(d => this.devices = d); this.closeDeviceModal(); this.toastService.success('Device updated'); }, error: () => this.toastService.error('Error updating device') });
    } else {
      this.devicesService.create(payload).subscribe({ next: (created) => { this.devicesService.getAll().subscribe(d => this.devices = d); this.form.get('deviceId')?.setValue((created as any).id); this.closeDeviceModal(); this.toastService.success('Device created'); }, error: () => this.toastService.error('Error creating device') });
    }
  }

  onDeviceBrandSaved(payload: Partial<any>) {
    const emittedId = (payload as any)?.id;
    const editingId = (this.editingDeviceBrand as any)?.id;

    if (emittedId) {
      this.deviceBrandsService.getAll().subscribe(b => this.deviceBrands = b);
      this.form.get('deviceBrandId')?.setValue(emittedId);
      this.closeDeviceBrandModal();
      this.toastService.success('Brand saved');
      return;
    }

    if (editingId) {
      this.deviceBrandsService.update(editingId, payload).subscribe({ next: () => { this.deviceBrandsService.getAll().subscribe(b => this.deviceBrands = b); this.closeDeviceBrandModal(); this.toastService.success('Brand updated'); }, error: () => this.toastService.error('Error updating brand') });
    } else {
      this.deviceBrandsService.create(payload).subscribe({ next: (created) => { this.deviceBrandsService.getAll().subscribe(b => this.deviceBrands = b); this.form.get('deviceBrandId')?.setValue((created as any).id); this.closeDeviceBrandModal(); this.toastService.success('Brand created'); }, error: () => this.toastService.error('Error creating brand') });
    }
  }

  onPaymentTypeSaved(payload: Partial<any>) {
    const emittedId = (payload as any)?.id;
    const editingId = (this.editingPaymentType as any)?.id;

    if (emittedId) {
      this.paymentTypesService.getAll().subscribe(p => this.paymentTypes = p);
      this.form.get('paymentTypeId')?.setValue(emittedId);
      this.closePaymentTypeModal();
      this.toastService.success('Payment type saved');
      return;
    }

    if (editingId) {
      this.paymentTypesService.update(editingId, payload).subscribe({ next: () => { this.paymentTypesService.getAll().subscribe(p => this.paymentTypes = p); this.closePaymentTypeModal(); this.toastService.success('Payment type updated'); }, error: () => this.toastService.error('Error updating payment type') });
    } else {
      // debug: log payload sent to API to help diagnose 400 errors
      console.log('Creating payment type with payload:', payload);
      this.paymentTypesService.create(payload).subscribe({ next: (created) => { this.paymentTypesService.getAll().subscribe(p => this.paymentTypes = p); this.form.get('paymentTypeId')?.setValue((created as any).id); this.closePaymentTypeModal(); this.toastService.success('Payment type created'); }, error: (err) => { console.error('Error creating payment type', err); this.toastService.error('Error creating payment type'); } });
    }
  }

  onDiagnosticSaved(payload: Partial<SODiagnostic>) {
    const id = (this.editingDiagnostic as any)?.id;
    const p = payload as SODiagnostic;
    const sanitized: Partial<SODiagnostic> = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : undefined,
      diagnostic: p.diagnostic,
      sendEmail: !!p.sendEmail,
      createdAt: p.createdAt,
      createdById: p.createdById != null ? Number(p.createdById) : undefined,
    };

    if (id) {
      this.soDiagnosticService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeDiagnosticModal(); this.toastService.success('Diagnostic updated'); },
        error: (err) => { this.toastService.error('Error updating diagnostic'); }
      });
    } else {
      this.soDiagnosticService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeDiagnosticModal(); this.toastService.success('Diagnostic created'); },
        error: (err) => { this.toastService.error('Error creating diagnostic'); }
      });
    }
  }

  onItemSaved(payload: Partial<SOItems>) {
    const id = (this.editingItem as any)?.id;
    const p = payload as SOItems;
    const sanitized: Partial<SOItems> = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : undefined,
      itemId: p.itemId != null ? Number(p.itemId) : undefined,
      quantity: p.quantity != null ? Number(p.quantity) : undefined,
      cost: p.cost != null ? Number(p.cost) : undefined,
      price: p.price != null ? Number(p.price) : undefined,
      discount: p.discount != null ? Number(p.discount) : undefined,
      note: p.note,
      createdById: p.createdById != null ? Number(p.createdById) : undefined
    };

    if (id) {
      this.soItemsService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeItemModal(); this.toastService.success('Item updated'); },
        error: (err) => { this.toastService.error('Error updating item'); }
      });
    } else {
      this.soItemsService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeItemModal(); this.toastService.success('Item created'); },
        error: (err) => { this.toastService.error('Error creating item'); }
      });
    }
  }

  onStatusSaved(payload: Partial<RepairStatus>) {
    const id = (this.editingStatus as any)?.id;
    const p = payload as RepairStatus;
    const sanitized: any = {
      centerId: p.centerId != null ? Number(p.centerId) : undefined,
      storeId: p.storeId != null ? Number(p.storeId) : undefined,
      serviceOrderId: p.serviceOrderId != null ? Number(p.serviceOrderId) : undefined,
      status: p.status,      
      createdById: p.createdById != null ? Number(p.createdById) : undefined,
    };

    if (id) {
      this.repairStatusService.update(id, sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeStatusModal(); this.toastService.success('Status updated'); },
        error: (err) => { this.toastService.error('Error updating status'); }
      });
    } else {
      // Log payload to help debug 400 responses from backend
      console.log('Creating repair status with payload:', sanitized);
      this.repairStatusService.create(sanitized).subscribe({
        next: () => { this.loadRelatedCollections(); this.closeStatusModal(); this.toastService.success('Status created'); },
        error: (err) => {
          console.error('Error creating repair status', err);
          // try to extract a useful message from the backend
          const msg = err?.error?.message || err?.message || 'Error creating status';
          this.toastService.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
      });
    }
  }

  ngOnChanges() {
    if (this.serviceOrder) {
      this.form.patchValue({
        centerId: this.serviceOrder.centerId,
        customerId: this.serviceOrder.customerId,
        deviceId: this.serviceOrder.deviceId,
        deviceBrandId: this.serviceOrder.deviceBrandId,
        paymentTypeId: this.serviceOrder.paymentTypeId,
        assignedTechId: this.serviceOrder.assignedTechId,
        createdById: this.serviceOrder.createdById,
        storeId: this.serviceOrder.storeId,
        model: this.serviceOrder.model,
        defectivePart: this.serviceOrder.defectivePart,
        serial: this.serviceOrder.serial,
        lock: this.serviceOrder.lock,
        price: this.serviceOrder.price,
        repairCost: this.serviceOrder.repairCost,
        totalCost: this.serviceOrder.totalCost,
        costdiscount: this.serviceOrder.costdiscount,
        advancePayment: this.serviceOrder.advancePayment,
        tax: this.serviceOrder.tax,
        noteReception: this.serviceOrder.noteReception,
        cloused: this.serviceOrder.cloused,
        canceled: this.serviceOrder.canceled,
      });
      // load related collections (either from serviceOrder or from API)
      this.loadRelatedCollections();
    }
  }

  private loadRelatedCollections() {
    const id = this.serviceOrder?.id ?? null;

    // SONotes
    if (this.serviceOrder?.sONotes && this.serviceOrder.sONotes.length > 0) {
      this.soNotes = this.serviceOrder.sONotes;
    } else if (id) {
      this.soNotesService.getAll().subscribe((all) => {
        this.soNotes = all.filter(n => (n.serviceOrder && (n.serviceOrder as any).id) === id);
      });
    } else {
      this.soNotes = [];
    }

    // SODiagnostics
    if (this.serviceOrder?.sODiagnostics && this.serviceOrder.sODiagnostics.length > 0) {
      this.soDiagnostics = this.serviceOrder.sODiagnostics;
    } else if (id) {
      this.soDiagnosticService.getAll().subscribe((all) => {
        this.soDiagnostics = all.filter(d => (d.serviceOrder && (d.serviceOrder as any).id) === id);
      });
    } else {
      this.soDiagnostics = [];
    }

    // SOItems
    if (this.serviceOrder?.sOItems && this.serviceOrder.sOItems.length > 0) {
      this.soItems = this.serviceOrder.sOItems;
    } else if (id) {
      this.soItemsService.getAll().subscribe((all) => {
        this.soItems = all.filter(i => (i.serviceOrderId ?? (i.serviceOrder && (i.serviceOrder as any).id)) === id);
      });
    } else {
      this.soItems = [];
    }

    // RepairStatuses
    if (this.serviceOrder?.repairStatuses && this.serviceOrder.repairStatuses.length > 0) {
      this.repairStatuses = this.serviceOrder.repairStatuses;
    } else if (id) {
      this.repairStatusService.getAll().subscribe((all) => {
        this.repairStatuses = all.filter(r => (r.serviceOrder && (r.serviceOrder as any).id) === id);
      });
    } else {
      this.repairStatuses = [];
    }
  }

  // actions for related lists
  openAddSONote() { this.addSONote.emit(this.serviceOrder?.id ?? null); }
  openEditSONote(n: SONotes) { this.editSONote.emit(n); }
  deleteSONote(id: number) {
    if (!confirm('Delete note?')) return;
    this.soNotesService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Note deleted'); },
      error: () => { this.toastService.error('Error deleting note'); }
    });
  }

  openAddSODiagnostic() { this.addSODiagnostic.emit(this.serviceOrder?.id ?? null); }
  openEditSODiagnostic(d: SODiagnostic) { this.editSODiagnostic.emit(d); }
  deleteSODiagnostic(id: number) {
    if (!confirm('Delete diagnostic?')) return;
    this.soDiagnosticService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Diagnostic deleted'); },
      error: () => { this.toastService.error('Error deleting diagnostic'); }
    });
  }

  openAddSOItem() { this.addSOItem.emit(this.serviceOrder?.id ?? null); }
  openEditSOItem(it: SOItems) { this.editSOItem.emit(it); }
  deleteSOItem(id: number) {
    if (!confirm('Delete item?')) return;
    this.soItemsService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Item deleted'); },
      error: () => { this.toastService.error('Error deleting item'); }
    });
  }

  openAddRepairStatus() { this.addRepairStatus.emit(this.serviceOrder?.id ?? null); }

  // Toggle helpers for accordions (used instead of Bootstrap JS collapse)
  toggleNotes() { this.showNotesCollapse = !this.showNotesCollapse; }
  toggleDiagnostics() { this.showDiagnosticsCollapse = !this.showDiagnosticsCollapse; }
  toggleStatuses() { this.showStatusesCollapse = !this.showStatusesCollapse; }
  toggleItems() { this.showItemsCollapse = !this.showItemsCollapse; }

  openEditRepairStatus(r: RepairStatus) { this.editRepairStatus.emit(r); }
  deleteRepairStatus(id: number) {
    if (!confirm('Delete status?')) return;
    this.repairStatusService.delete(id).subscribe({
      next: () => { this.loadRelatedCollections(); this.toastService.success('Status deleted'); },
      error: () => { this.toastService.error('Error deleting status'); }
    });
  }

  onCancel(): void {
  // Ajusta la ruta según tu configuración
  this.router.navigate(['/service-orders']); // o '/orders', '/so', etc.
}

  // using ToastService for notifications

  onSubmit() {
    if (!this.form.valid) return;

    // Build a sanitized payload containing only allowed primitive fields (ids and scalars).
    const fv = this.form.value;
    const payload: Partial<ServiceOrders> = {
      // reference ids
      centerId: fv.centerId !== null && fv.centerId !== undefined ? Number(fv.centerId) : undefined,
      storeId: fv.storeId !== null && fv.storeId !== undefined ? Number(fv.storeId) : undefined,
      customerId: fv.customerId !== null && fv.customerId !== undefined ? Number(fv.customerId) : undefined,
      deviceId: fv.deviceId !== null && fv.deviceId !== undefined ? Number(fv.deviceId) : undefined,
      deviceBrandId: fv.deviceBrandId !== null && fv.deviceBrandId !== undefined ? Number(fv.deviceBrandId) : undefined,
      paymentTypeId: fv.paymentTypeId !== null && fv.paymentTypeId !== undefined ? Number(fv.paymentTypeId) : undefined,
      assignedTechId: fv.assignedTechId !== null && fv.assignedTechId !== undefined ? Number(fv.assignedTechId) : undefined,
      createdById: fv.createdById !== null && fv.createdById !== undefined ? Number(fv.createdById) : undefined,

      // scalar fields
      model: fv.model,
      defectivePart: fv.defectivePart,
      serial: fv.serial,
      lock: !!fv.lock,
      price: fv.price !== null && fv.price !== undefined ? Number(fv.price) : 0,
      repairCost: fv.repairCost !== null && fv.repairCost !== undefined ? Number(fv.repairCost) : 0,
      totalCost: fv.totalCost !== null && fv.totalCost !== undefined ? Number(fv.totalCost) : 0,
      costdiscount: fv.costdiscount !== null && fv.costdiscount !== undefined ? Number(fv.costdiscount) : 0,
      advancePayment: fv.advancePayment !== null && fv.advancePayment !== undefined ? Number(fv.advancePayment) : 0,
      tax: fv.tax !== null && fv.tax !== undefined ? Number(fv.tax) : 0,
      noteReception: fv.noteReception,
      cloused: !!fv.cloused,
      canceled: !!fv.canceled,
    };

    // Emit sanitized payload only (do not include nested objects like customer, device, createdAt, etc.)
    this.save.emit(payload);
  }

  // Form control getters
  get centerId() { return this.form.get('centerId'); }
  get storeId() { return this.form.get('storeId'); }
  get customerId() { return this.form.get('customerId'); }
  get deviceId() { return this.form.get('deviceId'); }
  get deviceBrandId() { return this.form.get('deviceBrandId'); }
  get paymentTypeId() { return this.form.get('paymentTypeId'); }
  get assignedTechId() { return this.form.get('assignedTechId'); }
  get model() { return this.form.get('model'); }
  get defectivePart() { return this.form.get('defectivePart'); }
  get serial() { return this.form.get('serial'); }
  get price() { return this.form.get('price'); }
  get repairCost() { return this.form.get('repairCost'); }
  get totalCost() { return this.form.get('totalCost'); }
  get costdiscount() { return this.form.get('costdiscount'); }
  get advancePayment() { return this.form.get('advancePayment'); }
  get tax() { return this.form.get('tax'); }
  get noteReception() { return this.form.get('noteReception'); }
}
