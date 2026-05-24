import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Invoice } from '../../shared/models/Invoice';
import { InvoicesService } from '../../shared/services/invoices.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-invoices-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid py-4" *ngIf="invoice() as inv">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 class="h3 mb-1">INV-{{ inv.invoiceNumber }}</h1>
          <p class="text-muted mb-0">{{ customerName(inv) }} · {{ inv.issueDate | date:'MM/dd/yyyy' }}</p>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a class="btn btn-outline-secondary" routerLink="/invoices">
            <i class="bi bi-arrow-left me-1"></i> Back
          </a>
          <button class="btn btn-outline-primary" type="button" [disabled]="isSaving()" (click)="openPdf(inv)">
            <i class="bi bi-filetype-pdf me-1"></i> PDF
          </button>
          <a class="btn btn-outline-secondary" [routerLink]="['/invoices', inv.id, 'edit']" *ngIf="inv.status === 'draft'">
            <i class="bi bi-pencil me-1"></i> Edit
          </a>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div class="text-muted small">Customer</div>
                  <div class="fw-semibold">{{ customerName(inv) }}</div>
                  <div>{{ inv.billToAddress }}</div>
                  <div>{{ inv.billToContact }}</div>
                  <div>Via: {{ inv.via || 'Workshop' }}</div>
                </div>
                <span class="badge"
                  [class.bg-secondary]="inv.status === 'draft'"
                  [class.bg-primary]="inv.status === 'issued'"
                  [class.bg-success]="inv.status === 'paid'"
                  [class.bg-danger]="inv.status === 'void'">
                  {{ inv.status | titlecase }}
                </span>
              </div>

              <div class="table-responsive">
                <table class="table align-middle">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="text-end">Qty</th>
                      <th class="text-end">Unit</th>
                      <th class="text-end">Discount</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of inv.items || []">
                      <td>{{ item.description }}</td>
                      <td class="text-end">{{ item.quantity }}</td>
                      <td class="text-end">{{ item.unitPrice | currency:'USD':'symbol':'1.2-2' }}</td>
                      <td class="text-end">{{ item.discount || 0 | currency:'USD':'symbol':'1.2-2' }}</td>
                      <td class="text-end">{{ item.lineTotal || 0 | currency:'USD':'symbol':'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div *ngIf="inv.serviceSummary" class="mt-3">
                <div class="text-muted small mb-1">Service Summary</div>
                <pre class="mb-0 summary-text">{{ inv.serviceSummary }}</pre>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
              <h2 class="h5 mb-3">Totals</h2>
              <div class="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <strong>{{ inv.subtotal | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Tax {{ inv.tax || 0 }}%</span>
                <strong>{{ taxAmount(inv) | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Discount</span>
                <strong>{{ inv.discount | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>
              <hr>
              <div class="d-flex justify-content-between fs-5">
                <span>Total</span>
                <strong>{{ inv.total | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h2 class="h5 mb-3">Actions</h2>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" *ngIf="inv.status === 'draft'" [disabled]="isSaving()" (click)="issue(inv)">
                  Issue Invoice
                </button>
                <button class="btn btn-success" *ngIf="inv.status === 'issued'" [disabled]="isSaving()" (click)="recordPayment(inv)">
                  Record Payment
                </button>
                <button class="btn btn-outline-primary" [disabled]="isSaving()" (click)="sendEmail(inv)">
                  Send Email
                </button>
                <button class="btn btn-outline-danger" *ngIf="inv.status !== 'paid' && inv.status !== 'void'" [disabled]="isSaving()" (click)="voidInvoice(inv)">
                  Void Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-text {
      font-family: inherit;
      white-space: pre-wrap;
      background: transparent;
      border: 0;
      padding: 0;
    }
  `],
})
export class InvoicesDetailComponent implements OnInit {
  private service = inject(InvoicesService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly invoice = signal<Invoice | null>(null);
  readonly isSaving = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/invoices']);
      return;
    }
    this.loadInvoice(id);
  }

  loadInvoice(id: number): void {
    this.service.getById(id).subscribe({
      next: invoice => this.invoice.set(invoice),
      error: () => this.toast.error('Error loading invoice'),
    });
  }

  issue(invoice: Invoice): void {
    this.runAction(() => this.service.issue(invoice.id), 'Invoice issued');
  }

  openPdf(invoice: Invoice): void {
    this.isSaving.set(true);
    this.service.downloadPdf(invoice.id).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error opening invoice PDF'),
    });
  }

  recordPayment(invoice: Invoice): void {
    const notes = window.prompt('Payment notes', 'Paid in full') || undefined;
    this.runAction(() => this.service.recordPayment(invoice.id, notes), 'Payment recorded');
  }

  sendEmail(invoice: Invoice): void {
    const to = window.prompt('Send invoice to', invoice.customer?.email || '') || undefined;
    this.isSaving.set(true);
    this.service.sendEmail(invoice.id, { to }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => this.toast.success('Invoice email sent'),
      error: (err) => this.toast.error(err?.error?.message || 'Error sending invoice email'),
    });
  }

  voidInvoice(invoice: Invoice): void {
    const reason = window.prompt('Void reason');
    if (!reason?.trim()) return;
    this.runAction(() => this.service.voidInvoice(invoice.id, reason.trim()), 'Invoice voided');
  }

  customerName(invoice: Invoice): string {
    if (invoice.billToName) return invoice.billToName;
    const customer = invoice.customer;
    return customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : String(invoice.customerId);
  }

  taxAmount(invoice: Invoice): number {
    return Number(invoice.subtotal || 0) * (Number(invoice.tax || 0) / 100);
  }

  private runAction(requestFactory: () => any, successMessage: string): void {
    this.isSaving.set(true);
    requestFactory().pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (invoice: Invoice) => {
        this.invoice.set(invoice);
        this.toast.success(successMessage);
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Invoice action failed'),
    });
  }
}
