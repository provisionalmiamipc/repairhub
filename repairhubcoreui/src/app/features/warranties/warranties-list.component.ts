import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Warranty } from '../../shared/models/Warranty';
import { ToastService } from '../../shared/services/toast.service';
import { WarrantiesService } from '../../shared/services/warranties.service';

@Component({
  selector: 'app-warranties-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 class="h3 mb-1">Warranties</h1>
          <p class="text-muted mb-0">Active and historical service order warranties</p>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="p-3 border-bottom">
            <div class="row g-2 align-items-end">
              <div class="col-lg-5">
                <label class="form-label">Search</label>
                <div class="input-group">
                  <span class="input-group-text bg-transparent">
                    <i class="bi bi-search"></i>
                  </span>
                  <input
                    class="form-control"
                    type="search"
                    [ngModel]="searchTerm()"
                    (ngModelChange)="searchTerm.set($event)"
                    placeholder="Search order, customer, device, brand, model or serial"
                    autocomplete="off">
                </div>
              </div>
              <div class="col-lg-2">
                <label class="form-label">Status</label>
                <select class="form-select" [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="void">Void</option>
                </select>
              </div>
              <div class="col-lg-2">
                <label class="form-label">Device</label>
                <select class="form-select" [ngModel]="filterDevice()" (ngModelChange)="filterDevice.set(+$event)">
                  <option [ngValue]="0">All</option>
                  <option *ngFor="let device of deviceFilterOptions()" [ngValue]="device.id">{{ device.name }}</option>
                </select>
              </div>
              <div class="col-lg-2">
                <label class="form-label">Store</label>
                <select class="form-select" [ngModel]="filterStore()" (ngModelChange)="filterStore.set(+$event)">
                  <option [ngValue]="0">All</option>
                  <option *ngFor="let store of storeFilterOptions()" [ngValue]="store.id">{{ store.name }}</option>
                </select>
              </div>
              <div class="col-lg-1 d-grid">
                <button class="btn btn-outline-secondary" type="button" (click)="clearFilters()" [disabled]="activeFiltersCount() === 0">
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div class="p-4 text-muted" *ngIf="isLoading()">
            <span class="spinner-border spinner-border-sm me-2"></span> Loading warranties
          </div>

          <div class="table-responsive" *ngIf="!isLoading()">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Brand / Model</th>
                  <th>Status</th>
                  <th>Period</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let warranty of filteredWarranties(); trackBy: trackById">
                  <td>
                    <a [routerLink]="['/service-orders', warranty.serviceOrderId]">
                      {{ warranty.serviceOrder?.orderCode || ('#' + warranty.serviceOrderId) }}
                    </a>
                  </td>
                  <td>{{ customerName(warranty) }}</td>
                  <td>
                    {{ deviceName(warranty) }}
                    <div class="small text-muted">{{ warranty.serial || warranty.serviceOrder?.serial || '-' }}</div>
                  </td>
                  <td>
                    {{ brandName(warranty) }}
                    <div class="small text-muted">{{ warranty.serviceOrder?.model || '-' }}</div>
                  </td>
                  <td>
                    <span class="badge"
                      [class.bg-success]="warranty.status === 'active'"
                      [class.bg-secondary]="warranty.status === 'expired'"
                      [class.bg-danger]="warranty.status === 'void'">
                      {{ warranty.status | titlecase }}
                    </span>
                  </td>
                  <td>{{ warranty.warrantyDuration }} {{ warranty.warrantyDurationUnit }}</td>
                  <td>{{ warranty.warrantyStartDate | date:'MM/dd/yyyy' }}</td>
                  <td>{{ warranty.warrantyEndDate | date:'MM/dd/yyyy' }}</td>
                </tr>
                <tr *ngIf="!filteredWarranties().length">
                  <td colspan="8" class="text-center text-muted py-4">No warranties found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WarrantiesListComponent implements OnInit {
  private service = inject(WarrantiesService);
  private toast = inject(ToastService);
  readonly warranties = signal<Warranty[]>([]);
  readonly isLoading = signal(false);
  readonly searchTerm = signal('');
  readonly filterStatus = signal<'all' | 'active' | 'expired' | 'void'>('all');
  readonly filterDevice = signal<number>(0);
  readonly filterStore = signal<number>(0);

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.searchTerm().trim()) count += 1;
    if (this.filterStatus() !== 'all') count += 1;
    if (this.filterDevice() !== 0) count += 1;
    if (this.filterStore() !== 0) count += 1;
    return count;
  });

  readonly filteredWarranties = computed(() => {
    const query = this.normalize(this.searchTerm());
    const status = this.filterStatus();
    const deviceId = this.filterDevice();
    const storeId = this.filterStore();

    return this.warranties().filter(warranty => {
      const haystack = [
        warranty.serviceOrder?.orderCode,
        this.customerName(warranty),
        this.deviceName(warranty),
        this.brandName(warranty),
        warranty.serviceOrder?.model,
        warranty.serial,
        warranty.serviceOrder?.serial,
        warranty.status,
        warranty.store?.storeName,
      ].map(value => this.normalize(value)).join(' ');

      return (!query || haystack.includes(query)) &&
        (status === 'all' || warranty.status === status) &&
        (!deviceId || Number(warranty.deviceId) === deviceId) &&
        (!storeId || Number(warranty.storeId) === storeId);
    });
  });

  readonly deviceFilterOptions = computed(() => {
    const map = new Map<number, string>();
    this.warranties().forEach(warranty => {
      const id = Number(warranty.deviceId || 0);
      if (id) map.set(id, this.deviceName(warranty));
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly storeFilterOptions = computed(() => {
    const map = new Map<number, string>();
    this.warranties().forEach(warranty => {
      const id = Number(warranty.storeId || 0);
      if (id) map.set(id, warranty.store?.storeName || `Store #${id}`);
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.service.getAll(false).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: warranties => this.warranties.set(warranties ?? []),
      error: () => this.toast.error('Error loading warranties'),
    });
  }

  trackById(index: number, item: Warranty): number {
    return item?.id ?? index;
  }

  customerName(warranty: Warranty): string {
    const customer = warranty.customer;
    if (!customer) return String(warranty.customerId);
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  }

  deviceName(warranty: Warranty): string {
    return warranty.serviceOrder?.device?.name || warranty.device?.name || String(warranty.deviceId);
  }

  brandName(warranty: Warranty): string {
    const serviceOrder = warranty.serviceOrder as any;
    return serviceOrder?.deviceBrand?.name ||
      serviceOrder?.brand?.name ||
      serviceOrder?.device_brand?.name ||
      serviceOrder?.deviceBrandName ||
      '-';
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('all');
    this.filterDevice.set(0);
    this.filterStore.set(0);
  }

  private normalize(value: unknown): string {
    return String(value ?? '').toLowerCase().trim();
  }
}
