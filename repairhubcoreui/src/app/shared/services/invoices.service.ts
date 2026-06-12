import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceItem, InvoicePaymentLink } from '../models/Invoice';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private apiUrl = `${environment.apiUrl}/api/invoices`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Invoice[]>(this.apiUrl).pipe(timeout(30000));
  }

  getById(id: number) {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`).pipe(timeout(30000));
  }

  create(data: Partial<Invoice> & { items?: Partial<InvoiceItem>[] }) {
    return this.http.post<Invoice>(this.apiUrl, data).pipe(timeout(30000));
  }

  createFromServiceOrder(serviceOrderId: number, createdById?: number | null) {
    return this.http.post<Invoice>(`${this.apiUrl}/from-service-order/${serviceOrderId}`, { createdById }).pipe(timeout(30000));
  }

  update(id: number, data: Partial<Invoice>) {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}`, data).pipe(timeout(30000));
  }

  replaceItems(id: number, items: Partial<InvoiceItem>[]) {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}/items`, items).pipe(timeout(30000));
  }

  addServiceOrder(id: number, serviceOrderId: number) {
    return this.http.post<Invoice>(`${this.apiUrl}/${id}/service-orders/${serviceOrderId}`, {}).pipe(timeout(30000));
  }

  issue(id: number) {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}/issue`, {}).pipe(timeout(30000));
  }

  recordPayment(id: number, notes?: string) {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}/pay`, { notes }).pipe(timeout(30000));
  }

  voidInvoice(id: number, reason: string) {
    return this.http.patch<Invoice>(`${this.apiUrl}/${id}/void`, { reason }).pipe(timeout(30000));
  }

  sendEmail(id: number, data: { to?: string; subject?: string; message?: string } = {}) {
    return this.http.post<{ sent: boolean }>(`${this.apiUrl}/${id}/send-email`, data).pipe(timeout(30000));
  }

  downloadPdf(id: number) {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(timeout(30000));
  }

  getPaymentLinks(id: number) {
    return this.http.get<InvoicePaymentLink[]>(`${this.apiUrl}/${id}/payment-links`).pipe(timeout(30000));
  }

  createPaymentLink(id: number) {
    return this.http.post<InvoicePaymentLink>(`${this.apiUrl}/${id}/payment-links`, {}).pipe(timeout(30000));
  }

  retryPaymentLink(invoiceId: number, linkId: number) {
    return this.http.post<InvoicePaymentLink>(
      `${this.apiUrl}/${invoiceId}/payment-links/${linkId}/retry`,
      {},
    ).pipe(timeout(30000));
  }

  checkPaymentLink(invoiceId: number, linkId: number) {
    return this.http.post<InvoicePaymentLink>(
      `${this.apiUrl}/${invoiceId}/payment-links/${linkId}/check`,
      {},
    ).pipe(timeout(30000));
  }

  deletePaymentLink(invoiceId: number, linkId: number) {
    return this.http.delete<InvoicePaymentLink>(
      `${this.apiUrl}/${invoiceId}/payment-links/${linkId}`,
    ).pipe(timeout(30000));
  }

  pdfUrl(id: number) {
    return `${this.apiUrl}/${id}/pdf`;
  }
}
