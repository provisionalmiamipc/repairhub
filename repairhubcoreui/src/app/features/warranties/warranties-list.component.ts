import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Warranty } from '../../shared/models/Warranty';
import { ToastService } from '../../shared/services/toast.service';
import { WarrantiesService } from '../../shared/services/warranties.service';

@Component({
  selector: 'app-warranties-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
                  <th>Status</th>
                  <th>Period</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let warranty of warranties(); trackBy: trackById">
                  <td>
                    <a [routerLink]="['/service-orders', warranty.serviceOrderId]">
                      {{ warranty.serviceOrder?.orderCode || ('#' + warranty.serviceOrderId) }}
                    </a>
                  </td>
                  <td>{{ customerName(warranty) }}</td>
                  <td>{{ warranty.device?.name || warranty.deviceId }}</td>
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
                <tr *ngIf="!warranties().length">
                  <td colspan="7" class="text-center text-muted py-4">No warranties found</td>
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
}
