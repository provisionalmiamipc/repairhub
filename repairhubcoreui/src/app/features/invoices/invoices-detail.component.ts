import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../shared/models/Invoice';
import { InvoicesService } from '../../shared/services/invoices.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-invoices-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
                  <div *ngIf="hasValue(inv.billToAddress)">{{ inv.billToAddress }}</div>
                  <div *ngIf="hasValue(inv.billToContact)">{{ inv.billToContact }}</div>
                  <div *ngIf="hasValue(inv.via)">Via: {{ inv.via }}</div>
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
                      <td>
                        <div>{{ item.description }}</div>
                        <a
                          *ngIf="item.serviceOrderId"
                          class="small fw-semibold text-decoration-none"
                          [routerLink]="['/service-orders', item.serviceOrderId]">
                          Service Order {{ serviceOrderLabel(item) }}
                        </a>
                      </td>
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

          <div class="card border-0 shadow-sm mb-3" *ngIf="hasInvoiceDetails(inv)">
            <div class="card-body">
              <h2 class="h5 mb-3">Invoice Details</h2>
              <div class="invoice-detail-grid">
                <div *ngIf="hasValue(inv.center?.centerName || inv.centerId)">
                  <div class="text-muted small">Center</div>
                  <div class="fw-semibold">{{ inv.center?.centerName || inv.centerId }}</div>
                </div>
                <div *ngIf="hasValue(inv.store?.storeName || inv.storeId)">
                  <div class="text-muted small">Store</div>
                  <div class="fw-semibold">{{ inv.store?.storeName || inv.storeId }}</div>
                </div>
                <div *ngIf="hasValue(inv.serviceOrder?.orderCode || inv.serviceOrderId)">
                  <div class="text-muted small">Service Order</div>
                  <div class="fw-semibold">{{ inv.serviceOrder?.orderCode || inv.serviceOrderId }}</div>
                </div>
                <div *ngIf="hasValue(inv.dueDate)">
                  <div class="text-muted small">Due Date</div>
                  <div class="fw-semibold">{{ inv.dueDate | date:'MM/dd/yyyy' }}</div>
                </div>
                <div *ngIf="hasValue(createdByName(inv))">
                  <div class="text-muted small">Created By</div>
                  <div class="fw-semibold">{{ createdByName(inv) }}</div>
                </div>
                <div *ngIf="hasValue(inv.createdAt)">
                  <div class="text-muted small">Created At</div>
                  <div class="fw-semibold">{{ inv.createdAt | date:'MM/dd/yyyy, h:mm a' }}</div>
                </div>
                <div *ngIf="hasValue(inv.updatedAt)">
                  <div class="text-muted small">Updated At</div>
                  <div class="fw-semibold">{{ inv.updatedAt | date:'MM/dd/yyyy, h:mm a' }}</div>
                </div>
              </div>

              <div *ngIf="hasValue(inv.notes)" class="mt-3">
                <div class="text-muted small mb-1">Notes</div>
                <pre class="mb-0 summary-text">{{ inv.notes }}</pre>
              </div>

              <div *ngIf="hasValue(inv.terms)" class="mt-3">
                <div class="text-muted small mb-1">Terms</div>
                <pre class="mb-0 summary-text">{{ inv.terms }}</pre>
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
              <div class="mt-3 pt-3 border-top" *ngIf="inv.paymentType || inv.paymentInstructions">
                <div ><span class="text-muted small">Payment Method: </span><b>{{ inv.paymentType?.type || 'N/A' }}</b></div>
                <div class="small mt-1" *ngIf="inv.paymentInstructions">{{ inv.paymentInstructions }}</div>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h2 class="h5 mb-3">Actions</h2>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" *ngIf="inv.status === 'draft'" [disabled]="isSaving()" (click)="openIssueModal(inv)">
                  Issue Invoice
                </button>
                <button class="btn btn-success" *ngIf="inv.status === 'issued'" [disabled]="isSaving()" (click)="openPaymentModal(inv)">
                  Record Payment
                </button>
                <button class="btn btn-outline-primary" [disabled]="isSaving()" (click)="openEmailModal(inv)">
                  Send Email
                </button>
                <button class="btn btn-outline-danger" *ngIf="inv.status !== 'paid' && inv.status !== 'void'" [disabled]="isSaving()" (click)="openVoidModal(inv)">
                  Void Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade show d-block invoice-action-modal" tabindex="-1" role="dialog" aria-modal="true" *ngIf="actionModal() as modal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">{{ modal.title }}</h5>
            <button type="button" class="btn-close" aria-label="Close" [disabled]="isSaving()" (click)="closeActionModal()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">{{ modal.message }}</p>

            <div *ngIf="modal.type === 'payment'">
              <label class="form-label">Payment notes</label>
              <textarea class="form-control" rows="3" [(ngModel)]="modalNotes" placeholder="Paid in full"></textarea>
            </div>

            <div *ngIf="modal.type === 'email'" class="d-grid gap-3">
              <div>
                <label class="form-label">Send invoice to</label>
                <input class="form-control" type="email" [(ngModel)]="modalEmail" placeholder="customer@email.com">
              </div>
              <div>
                <label class="form-label">Message</label>
                <textarea class="form-control" rows="3" [(ngModel)]="modalMessage"></textarea>
              </div>
            </div>

            <div *ngIf="modal.type === 'void'">
              <label class="form-label">Void reason</label>
              <textarea class="form-control" rows="3" [(ngModel)]="modalReason" placeholder="Reason required"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" [disabled]="isSaving()" (click)="closeActionModal()">Cancel</button>
            <button type="button" class="btn" [ngClass]="modal.confirmClass" [disabled]="isSaving()" (click)="confirmActionModal()">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="isSaving()"></span>
              {{ modal.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="actionModal()"></div>
  `,
  styles: [`
    .summary-text {
      font-family: inherit;
      white-space: pre-wrap;
      background: transparent;
      border: 0;
      padding: 0;
    }

    .invoice-action-modal {
      background: rgba(0, 0, 0, 0.18);
    }

    .invoice-detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
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
  readonly actionModal = signal<{
    type: 'issue' | 'payment' | 'email' | 'void';
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass: string;
  } | null>(null);
  selectedInvoice: Invoice | null = null;
  modalNotes = 'Paid in full';
  modalEmail = '';
  modalMessage = 'Please find your invoice attached.';
  modalReason = '';

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

  openIssueModal(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.actionModal.set({
      type: 'issue',
      title: 'Issue invoice',
      message: 'This will change the invoice status from draft to issued. You can still send it by email afterward.',
      confirmLabel: 'Issue Invoice',
      confirmClass: 'btn-primary',
    });
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

  openPaymentModal(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.modalNotes = 'Paid in full';
    this.actionModal.set({
      type: 'payment',
      title: 'Record payment',
      message: 'Confirm that this issued invoice has been paid.',
      confirmLabel: 'Record Payment',
      confirmClass: 'btn-success',
    });
  }

  openEmailModal(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.modalEmail = invoice.customer?.email || '';
    this.modalMessage = 'Please find your invoice attached.';
    this.actionModal.set({
      type: 'email',
      title: 'Send invoice by email',
      message: 'The invoice PDF will be attached to the email.',
      confirmLabel: 'Send Email',
      confirmClass: 'btn-primary',
    });
  }

  openVoidModal(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.modalReason = '';
    this.actionModal.set({
      type: 'void',
      title: 'Void invoice',
      message: 'This will mark the invoice as void. Please include the reason.',
      confirmLabel: 'Void Invoice',
      confirmClass: 'btn-danger',
    });
  }

  closeActionModal(): void {
    if (this.isSaving()) return;
    this.actionModal.set(null);
    this.selectedInvoice = null;
  }

  confirmActionModal(): void {
    const modal = this.actionModal();
    const invoice = this.selectedInvoice;
    if (!modal || !invoice) return;

    if (modal.type === 'issue') {
      this.runAction(() => this.service.issue(invoice.id), 'Invoice issued', true, 'issued');
      return;
    }

    if (modal.type === 'payment') {
      this.runAction(() => this.service.recordPayment(invoice.id, this.modalNotes || undefined), 'Payment recorded', true, 'paid');
      return;
    }

    if (modal.type === 'email') {
      this.isSaving.set(true);
      this.service.sendEmail(invoice.id, {
        to: this.modalEmail || undefined,
        message: this.modalMessage || undefined,
      }).pipe(finalize(() => this.isSaving.set(false))).subscribe({
        next: () => {
          this.actionModal.set(null);
          this.selectedInvoice = null;
          this.toast.success('Invoice email sent');
          this.router.navigate(['/invoices']);
        },
        error: (err) => this.toast.error(err?.error?.message || 'Error sending invoice email'),
      });
      return;
    }

    if (modal.type === 'void') {
      const reason = this.modalReason.trim();
      if (!reason) {
        this.toast.error('Void reason is required');
        return;
      }
      this.runAction(() => this.service.voidInvoice(invoice.id, reason), 'Invoice voided', true, 'void');
    }
  }

  customerName(invoice: Invoice): string {
    if (invoice.billToName) return invoice.billToName;
    const customer = invoice.customer;
    return customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : String(invoice.customerId);
  }

  taxAmount(invoice: Invoice): number {
    return Number(invoice.subtotal || 0) * (Number(invoice.tax || 0) / 100);
  }

  hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  createdByName(invoice: Invoice): string {
    return [invoice.createdBy?.firstName, invoice.createdBy?.lastName].filter(Boolean).join(' ');
  }

  serviceOrderLabel(item: InvoiceItem): string {
    return item.serviceOrder?.orderCode || `#${item.serviceOrderId}`;
  }

  hasInvoiceDetails(invoice: Invoice): boolean {
    return [
      invoice.center?.centerName || invoice.centerId,
      invoice.store?.storeName || invoice.storeId,
      invoice.serviceOrder?.orderCode || invoice.serviceOrderId,
      invoice.dueDate,
      this.createdByName(invoice),
      invoice.createdAt,
      invoice.updatedAt,
      invoice.notes,
      invoice.terms,
    ].some(value => this.hasValue(value));
  }

  private runAction(
    requestFactory: () => any,
    successMessage: string,
    closeModal = false,
    expectedStatus?: InvoiceStatus
  ): void {
    this.isSaving.set(true);
    requestFactory().pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (invoice: Invoice | null | undefined) => {
        const current = this.invoice();
        const updatedInvoice = {
          ...(current || {}),
          ...(invoice || {}),
          ...(expectedStatus ? { status: expectedStatus } : {}),
        } as Invoice;

        this.invoice.set(updatedInvoice);
        if (closeModal) {
          this.actionModal.set(null);
          this.selectedInvoice = null;
        }
        this.toast.success(successMessage);
        this.router.navigate(['/invoices']);
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Invoice action failed'),
    });
  }
}
