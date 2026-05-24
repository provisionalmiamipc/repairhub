import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Invoice } from '../../shared/models/Invoice';
import { InvoicesService } from '../../shared/services/invoices.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 class="h3 mb-1">Invoices</h1>
          <p class="text-muted mb-0">Drafts, issued invoices and payments</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="createNew()">
          <i class="bi bi-plus-lg me-1"></i> New Invoice
        </button>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="p-3 border-bottom">
            <div class="input-group">
              <span class="input-group-text bg-transparent">
                <i class="bi bi-search"></i>
              </span>
              <input
                class="form-control"
                type="search"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                placeholder="Search invoice, customer, payment type, status or total"
                autocomplete="off">
            </div>
          </div>

          <div class="p-4 text-muted" *ngIf="isLoading()">
            <span class="spinner-border spinner-border-sm me-2"></span> Loading invoices
          </div>

          <div class="table-responsive" *ngIf="!isLoading()">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Payment Type</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th class="text-end">Total</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let invoice of filteredInvoices(); trackBy: trackById">
                  <td>
                    <a [routerLink]="['/invoices', invoice.id]" class="fw-semibold">
                      INV-{{ invoice.invoiceNumber }}
                    </a>
                  </td>
                  <td>{{ customerName(invoice) }}</td>
                  <td>{{ paymentTypeName(invoice) }}</td>
                  <td>
                    <span class="badge"
                      [class.bg-secondary]="invoice.status === 'draft'"
                      [class.bg-primary]="invoice.status === 'issued'"
                      [class.bg-success]="invoice.status === 'paid'"
                      [class.bg-danger]="invoice.status === 'void'">
                      {{ invoice.status | titlecase }}
                    </span>
                  </td>
                  <td>{{ invoice.issueDate | date:'MM/dd/yyyy' }}</td>
                  <td class="text-end">{{ invoice.total | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td class="text-end">
                    <a class="btn btn-sm btn-outline-primary me-1" [routerLink]="['/invoices', invoice.id]">
                      <i class="bi bi-eye"></i>
                    </a>
                    <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/invoices', invoice.id, 'edit']" *ngIf="invoice.status === 'draft'">
                      <i class="bi bi-pencil"></i>
                    </a>
                  </td>
                </tr>
                <tr *ngIf="!filteredInvoices().length">
                  <td colspan="7" class="text-center text-muted py-4">No invoices found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InvoicesListComponent implements OnInit {
  private service = inject(InvoicesService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly invoices = signal<Invoice[]>([]);
  readonly isLoading = signal(false);
  readonly searchTerm = signal('');

  readonly filteredInvoices = computed(() => {
    const query = this.normalize(this.searchTerm());
    if (!query) return this.invoices();

    return this.invoices().filter(invoice => {
      const haystack = [
        invoice.invoiceNumber,
        `INV-${invoice.invoiceNumber}`,
        this.customerName(invoice),
        this.paymentTypeName(invoice),
        invoice.status,
        invoice.issueDate,
        invoice.total,
      ].map(value => this.normalize(value)).join(' ');

      return haystack.includes(query);
    });
  });

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.service.getAll().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: invoices => this.invoices.set(invoices ?? []),
      error: () => this.toast.error('Error loading invoices'),
    });
  }

  createNew(): void {
    this.router.navigate(['/invoices/new']);
  }

  trackById(index: number, item: Invoice): number {
    return item?.id ?? index;
  }

  customerName(invoice: Invoice): string {
    if (invoice.billToName) return invoice.billToName;
    const customer = invoice.customer;
    return customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : String(invoice.customerId);
  }

  paymentTypeName(invoice: Invoice): string {
    return invoice.paymentType?.type || 'Not selected';
  }

  private normalize(value: unknown): string {
    return String(value ?? '').toLowerCase().trim();
  }
}
