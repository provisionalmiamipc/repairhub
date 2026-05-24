import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Centers } from '../../shared/models/Centers';
import { Customers } from '../../shared/models/Customers';
import { Invoice, InvoiceItem } from '../../shared/models/Invoice';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { Stores } from '../../shared/models/Stores';
import { CustomerSearchComponent } from '../customers/customer-search.component';
import { AuthService } from '../../shared/services/auth.service';
import { CentersService } from '../../shared/services/centers.service';
import { CustomersService } from '../../shared/services/customers.service';
import { InvoicesService } from '../../shared/services/invoices.service';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { StoresService } from '../../shared/services/stores.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-invoices-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerSearchComponent],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 class="h3 mb-1">{{ isEditMode() ? 'Edit Invoice' : 'New Invoice' }}</h1>
          <p class="text-muted mb-0">Create a draft invoice with editable lines, tax and summary</p>
        </div>
        <button type="button" class="btn btn-outline-secondary" (click)="cancel()">
          <i class="bi bi-arrow-left me-1"></i> Back
        </button>
      </div>

      <form class="card border-0 shadow-sm" (ngSubmit)="save()">
        <div class="card-body">
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <label class="form-label">Invoice Number</label>
              <input class="form-control" [(ngModel)]="form.invoiceNumber" name="invoiceNumber" placeholder="Auto if blank">
            </div>
            <div class="col-md-3">
              <label class="form-label">Issue Date</label>
              <input class="form-control" type="date" [(ngModel)]="form.issueDate" name="issueDate" required>
            </div>
            <div class="col-md-3">
              <label class="form-label">Center</label>
              <select class="form-select" [(ngModel)]="form.centerId" name="centerId" required (ngModelChange)="onCenterChange()">
                <option [ngValue]="null">Select center</option>
                <option *ngFor="let center of centers()" [ngValue]="center.id">{{ center.centerName }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Store</label>
              <select class="form-select" [(ngModel)]="form.storeId" name="storeId" required>
                <option [ngValue]="null">Select store</option>
                <option *ngFor="let store of filteredStores()" [ngValue]="store.id">{{ store.storeName }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Customer</label>
              <div class="input-group">
                <input class="form-control" [value]="selectedCustomerLabel()" placeholder="Search customer" readonly>
                <button class="btn btn-outline-secondary" type="button" (click)="openCustomerSearch()">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Bill To Name</label>
              <input class="form-control" [(ngModel)]="form.billToName" name="billToName">
            </div>
            <div class="col-md-4">
              <label class="form-label">Via</label>
              <input class="form-control" [(ngModel)]="form.via" name="via">
            </div>
            <div class="col-md-6">
              <label class="form-label">Bill To Address</label>
              <input class="form-control" [(ngModel)]="form.billToAddress" name="billToAddress">
            </div>
            <div class="col-md-6">
              <label class="form-label">Bill To Contact</label>
              <input class="form-control" [(ngModel)]="form.billToContact" name="billToContact">
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-2">
            <h2 class="h5 mb-0">Lines</h2>
          </div>

          <div class="row g-2 align-items-end mb-3">
            <div class="col-lg-7">
              <label class="form-label">Add Service Order</label>
              <select class="form-select" [(ngModel)]="selectedServiceOrderId" name="selectedServiceOrderId">
                <option [ngValue]="null">{{ form.customerId ? 'Select service order' : 'Select a customer first' }}</option>
                <option *ngFor="let order of availableServiceOrders()" [ngValue]="order.id">
                  {{ order.orderCode }} - {{ serviceOrderDeviceLabel(order) }} - {{ order.defectivePart || 'No defective part' }}
                </option>
              </select>
              <div class="form-text" *ngIf="form.customerId">
                Showing service orders for {{ selectedCustomerLabel() }}.
              </div>
            </div>
            <div class="col-lg-auto invoice-add-actions">
              <button type="button" class="btn btn-outline-primary" (click)="addSelectedServiceOrder()" [disabled]="!selectedServiceOrderId">
                <i class="bi bi-receipt me-1"></i> Add Order
              </button>
            </div>
            <div class="col-lg-auto invoice-add-actions">
              <button type="button" class="btn btn-outline-secondary" (click)="addLine()">
                <i class="bi bi-plus-lg me-1"></i> Add Line
              </button>
            </div>
          </div>

          <div class="table-responsive mb-4">
            <table class="table align-middle">
              <thead>
                <tr>
                  <th style="width: 130px;">Type</th>
                  <th>Description</th>
                  <th style="width: 110px;">Qty</th>
                  <th style="width: 140px;">Unit Price</th>
                  <th style="width: 120px;">Discount</th>
                  <th style="width: 120px;" class="text-end">Total</th>
                  <th style="width: 54px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let line of lines; let i = index; trackBy: trackByIndex">
                  <td>
                    <select class="form-select form-select-sm" [(ngModel)]="line.itemType" [name]="'itemType' + i">
                      <option value="service">Service</option>
                      <option value="part">Part</option>
                      <option value="labor">Labor</option>
                      <option value="custom">Custom</option>
                    </select>
                  </td>
                  <td><input class="form-control form-control-sm" [(ngModel)]="line.description" [name]="'description' + i" required></td>
                  <td><input class="form-control form-control-sm" type="number" min="0" step="0.01" [(ngModel)]="line.quantity" [name]="'quantity' + i"></td>
                  <td><input class="form-control form-control-sm" type="number" step="0.01" [(ngModel)]="line.unitPrice" [name]="'unitPrice' + i"></td>
                  <td><input class="form-control form-control-sm" type="number" step="0.01" [(ngModel)]="line.discount" [name]="'discount' + i"></td>
                  <td class="text-end">{{ lineTotal(line) | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeLine(i)" [disabled]="lines.length === 1">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="row g-3">
            <div class="col-lg-7">
              <label class="form-label">Service Summary</label>
              <textarea class="form-control" rows="4" [(ngModel)]="form.serviceSummary" name="serviceSummary"></textarea>
            </div>
            <div class="col-lg-5">
              <div class="border rounded p-3 invoice-totals-panel">
                <div class="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <strong>{{ subtotal() | currency:'USD':'symbol':'1.2-2' }}</strong>
                </div>
                <label class="form-label mb-1">Tax %</label>
                <input class="form-control mb-2" type="number" step="0.01" [(ngModel)]="form.tax" name="tax">
                <div class="d-flex justify-content-between mb-2">
                  <span>Tax Amount</span>
                  <strong>{{ taxAmount() | currency:'USD':'symbol':'1.2-2' }}</strong>
                </div>
                <label class="form-label mb-1">Invoice Discount</label>
                <input class="form-control mb-3" type="number" step="0.01" [(ngModel)]="form.discount" name="discount">
                <div class="d-flex justify-content-between fs-5">
                  <span>Total</span>
                  <strong>{{ total() | currency:'USD':'symbol':'1.2-2' }}</strong>
                </div>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Terms</label>
              <textarea class="form-control" rows="3" [(ngModel)]="form.terms" name="terms"></textarea>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="isSaving()">
            <span class="spinner-border spinner-border-sm me-1" *ngIf="isSaving()"></span>
            Save Draft
          </button>
        </div>
      </form>

      <app-customer-search
        *ngIf="showCustomerSearch"
        [isModal]="true"
        (select)="onCustomerSelected($event)"
        (cancel)="closeCustomerSearch()">
      </app-customer-search>
    </div>
  `,
  styles: [`
    .invoice-totals-panel {
      background: transparent;
    }

    .invoice-add-actions {
      padding-bottom: 24px;
    }

    @media (max-width: 991.98px) {
      .invoice-add-actions {
        padding-bottom: 0;
      }
    }
  `],
})
export class InvoicesFormComponent implements OnInit {
  private invoicesService = inject(InvoicesService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private serviceOrdersService = inject(ServiceOrdersService);
  private customersService = inject(CustomersService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly customers = signal<Customers[]>([]);
  readonly serviceOrders = signal<ServiceOrders[]>([]);
  readonly isSaving = signal(false);
  readonly isEditMode = signal(false);
  invoiceId: number | null = null;
  selectedServiceOrderId: number | null = null;
  showCustomerSearch = false;

  form: any = {
    invoiceNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    centerId: null,
    storeId: null,
    customerId: null,
    billToName: '',
    billToAddress: '',
    billToContact: '',
    via: 'Workshop',
    tax: 0,
    discount: 0,
    serviceSummary: '',
    terms: '',
  };

  lines: Partial<InvoiceItem>[] = [this.newLine()];

  readonly filteredStores = computed(() => {
    const centerId = Number(this.form.centerId || 0);
    return this.stores().filter(store => !centerId || Number(store.centerId) === centerId);
  });

  readonly availableServiceOrders = computed(() => {
    const centerId = Number(this.form.centerId || 0);
    const storeId = Number(this.form.storeId || 0);
    const existingIds = new Set(this.lines.map(line => Number(line.serviceOrderId || 0)).filter(Boolean));

    return this.serviceOrders().filter(order =>
      (!centerId || Number(order.centerId) === centerId) &&
      (!storeId || Number(order.storeId) === storeId) &&
      !existingIds.has(Number(order.id))
    );
  });

  ngOnInit(): void {
    this.loadLookups();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.invoiceId = Number(id);
      this.isEditMode.set(true);
      this.loadInvoice(this.invoiceId);
    } else {
      this.applyEmployeeDefaults();
    }
  }

  loadLookups(): void {
    this.centersService.getAll().subscribe(data => this.centers.set(data || []));
    this.storesService.getAll().subscribe(data => this.stores.set(data || []));
    this.customersService.getAll().subscribe(data => this.customers.set(data || []));
  }

  loadInvoice(id: number): void {
    this.invoicesService.getById(id).subscribe({
      next: invoice => {
        this.form = {
          invoiceNumber: invoice.invoiceNumber,
          issueDate: String(invoice.issueDate).slice(0, 10),
          centerId: invoice.centerId,
          storeId: invoice.storeId,
          customerId: invoice.customerId,
          billToName: invoice.billToName || '',
          billToAddress: invoice.billToAddress || '',
          billToContact: invoice.billToContact || '',
          via: invoice.via || 'Workshop',
          tax: Number(invoice.tax || 0),
          discount: Number(invoice.discount || 0),
          serviceSummary: invoice.serviceSummary || '',
          terms: invoice.terms || '',
        };
        this.lines = invoice.items?.length ? invoice.items.map(item => ({ ...item })) : [this.newLine()];
        this.loadServiceOrdersForCustomer(invoice.customerId);
      },
      error: () => this.toast.error('Error loading invoice'),
    });
  }

  applyEmployeeDefaults(): void {
    const employee = this.authService.getCurrentEmployee();
    if (employee?.centerId) this.form.centerId = employee.centerId;
    if (employee?.storeId) this.form.storeId = employee.storeId;
  }

  onCenterChange(): void {
    if (this.form.storeId && !this.filteredStores().some(store => store.id === this.form.storeId)) {
      this.form.storeId = null;
    }
  }

  applyCustomerDefaults(): void {
    const customer = this.customers().find(item => item.id === Number(this.form.customerId));
    if (!customer) return;
    this.form.billToName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    this.form.billToAddress = customer.city || '';
    this.form.billToContact = [customer.phone, customer.email].filter(Boolean).join(' | ');
    if (!this.form.centerId) this.form.centerId = customer.centerId;
    if (!this.form.storeId) this.form.storeId = customer.storeId;
    this.loadServiceOrdersForCustomer(customer.id);
  }

  openCustomerSearch(): void {
    this.showCustomerSearch = true;
  }

  closeCustomerSearch(): void {
    this.showCustomerSearch = false;
  }

  onCustomerSelected(customer: Customers): void {
    this.form.customerId = customer.id;
    this.form.billToName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    this.form.billToAddress = customer.city || '';
    this.form.billToContact = [customer.phone, customer.email].filter(Boolean).join(' | ');
    this.form.centerId = customer.centerId;
    this.form.storeId = customer.storeId;
    this.lines = this.lines.filter(line => !line.serviceOrderId);
    if (!this.lines.length) this.lines = [this.newLine()];
    this.form.serviceSummary = '';
    this.selectedServiceOrderId = null;
    this.loadServiceOrdersForCustomer(customer.id);
    this.closeCustomerSearch();
  }

  selectedCustomerLabel(): string {
    const customer = this.customers().find(item => item.id === Number(this.form.customerId));
    if (!customer) return this.form.billToName || '';
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  }

  addLine(): void {
    this.lines = [...this.lines, this.newLine(this.lines.length)];
  }

  addSelectedServiceOrder(): void {
    const order = this.serviceOrders().find(item => item.id === Number(this.selectedServiceOrderId));
    if (!order) return;

    if (!this.form.customerId) this.form.customerId = order.customerId;
    if (!this.form.centerId) this.form.centerId = order.centerId;
    if (!this.form.storeId) this.form.storeId = order.storeId;

    this.lines = [
      ...this.lines.filter(line => String(line.description || '').trim()),
      {
        itemType: 'service',
        serviceOrderId: order.id,
        description: this.serviceOrderDescription(order),
        quantity: 1,
        unitPrice: Number(order.price || 0),
        discount: Number(order.costdiscount || 0),
        sortOrder: this.lines.length,
      },
    ];

    this.appendServiceSummary(order);
    this.selectedServiceOrderId = null;
  }

  removeLine(index: number): void {
    this.lines = this.lines.filter((_, i) => i !== index);
  }

  save(): void {
    if (!this.form.centerId || !this.form.storeId || !this.form.customerId) {
      this.toast.error('Center, store and customer are required');
      return;
    }

    const items = this.lines
      .filter(line => String(line.description || '').trim())
      .map((line, index) => ({
        itemType: line.itemType || 'custom',
        description: String(line.description || '').trim(),
        serviceOrderId: line.serviceOrderId || null,
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        discount: Number(line.discount || 0),
        sortOrder: index,
      }));

    if (!items.length) {
      this.toast.error('Add at least one invoice line');
      return;
    }

    const payload: any = {
      ...this.form,
      centerId: Number(this.form.centerId),
      storeId: Number(this.form.storeId),
      customerId: Number(this.form.customerId),
      tax: Number(this.form.tax || 0),
      discount: Number(this.form.discount || 0),
      createdById: this.authService.getEmployeeId(),
      items,
    };

    if (!payload.invoiceNumber) delete payload.invoiceNumber;

    this.isSaving.set(true);
    const updatePayload = {
      invoiceNumber: payload.invoiceNumber,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      billToName: payload.billToName,
      billToAddress: payload.billToAddress,
      billToContact: payload.billToContact,
      via: payload.via,
      tax: payload.tax,
      discount: payload.discount,
      serviceSummary: payload.serviceSummary,
      terms: payload.terms,
      notes: payload.notes,
    };

    Object.keys(updatePayload).forEach((key) => {
      if ((updatePayload as any)[key] === undefined || (updatePayload as any)[key] === '') {
        delete (updatePayload as any)[key];
      }
    });

    const request$ = this.isEditMode() && this.invoiceId
      ? this.invoicesService.update(this.invoiceId, updatePayload)
      : this.invoicesService.create(payload);

    request$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: invoice => {
        if (this.isEditMode() && this.invoiceId) {
          this.invoicesService.replaceItems(this.invoiceId, items).subscribe({
            next: updated => this.router.navigate(['/invoices', updated.id]),
            error: () => this.toast.error('Invoice saved, but lines could not be updated'),
          });
          return;
        }
        this.router.navigate(['/invoices', invoice.id]);
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error saving invoice'),
    });
  }

  cancel(): void {
    this.router.navigate(this.invoiceId ? ['/invoices', this.invoiceId] : ['/invoices']);
  }

  subtotal(): number {
    return this.lines.reduce((sum, line) => sum + this.lineTotal(line), 0);
  }

  total(): number {
    return this.subtotal() + this.taxAmount() - Number(this.form.discount || 0);
  }

  taxAmount(): number {
    return this.subtotal() * (Number(this.form.tax || 0) / 100);
  }

  lineTotal(line: Partial<InvoiceItem>): number {
    return Number(line.quantity || 0) * Number(line.unitPrice || 0) - Number(line.discount || 0);
  }

  trackByIndex(index: number): number {
    return index;
  }

  private newLine(sortOrder = 0): Partial<InvoiceItem> {
    return { itemType: 'custom', description: '', quantity: 1, unitPrice: 0, discount: 0, sortOrder };
  }

  private loadServiceOrdersForCustomer(customerId: number): void {
    if (!customerId) {
      this.serviceOrders.set([]);
      return;
    }

    this.serviceOrdersService.getByCustomer(customerId).subscribe({
      next: orders => this.serviceOrders.set(orders || []),
      error: () => {
        this.serviceOrders.set([]);
        this.toast.error('Error loading customer service orders');
      },
    });
  }

  serviceOrderDeviceLabel(order: ServiceOrders): string {
    return [order.device?.name, order.deviceBrand?.name, order.model].filter(Boolean).join(' ') || 'Service order';
  }

  private serviceOrderDescription(order: ServiceOrders): string {
    return `${order.orderCode} - ${this.serviceOrderDeviceLabel(order)}`;
  }

  private appendServiceSummary(order: ServiceOrders): void {
    const line = `${order.orderCode} - ${order.defectivePart || order.model || 'Repair service'}`;
    const lines = String(this.form.serviceSummary || '')
      .split('\n')
      .map((item: string) => item.trim())
      .filter(Boolean);

    if (!lines.includes(line)) lines.push(line);
    this.form.serviceSummary = lines.join('\n');
  }
}
