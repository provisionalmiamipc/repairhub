import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, timeout } from 'rxjs/operators';
import { BaseService } from './base.service';
import { PaymentLinkRequest, ServiceOrderPaymentLink, ServiceOrders } from '../models/ServiceOrders';
import { environment } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService extends BaseService<ServiceOrders> {
  protected apiUrl = `${environment.apiUrl}/api/service-orders`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }

  resendEmail(id: number) {
    return this.http.post<any>(`${this.apiUrl}/${id}/resend-email`, {}).pipe(timeout(30000));
  }

  downloadPdf(id: number) {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(timeout(30000));
  }

  getByCustomer(customerId: number) {
    return this.http.get<ServiceOrders[]>(`${this.apiUrl}?customerId=${customerId}`).pipe(timeout(30000));
  }

  getPaymentLinks(id: number) {
    return this.http.get<ServiceOrderPaymentLink[]>(`${this.apiUrl}/${id}/payment-links`).pipe(timeout(30000));
  }

  createPaymentLink(id: number, request: PaymentLinkRequest) {
    return this.http.post<ServiceOrderPaymentLink>(`${this.apiUrl}/${id}/payment-links`, request).pipe(timeout(30000));
  }

  retryPaymentLink(serviceOrderId: number, linkId: number) {
    return this.http.post<ServiceOrderPaymentLink>(
      `${this.apiUrl}/${serviceOrderId}/payment-links/${linkId}/retry`,
      {},
    ).pipe(timeout(30000));
  }

  deletePaymentLink(serviceOrderId: number, linkId: number) {
    return this.http.delete<ServiceOrderPaymentLink>(
      `${this.apiUrl}/${serviceOrderId}/payment-links/${linkId}`,
    ).pipe(timeout(30000));
  }

  createWithImages(data: Partial<ServiceOrders>, images: File[]) {
    return this.http.post<ServiceOrders>(this.apiUrl, this.toFormData(data, images)).pipe(
      timeout(30000),
      tap((newItem) => {
        const current = this.dataSubject.getValue();
        this.dataSubject.next([...current, newItem]);
        this.selectedSubject.next(newItem);
        this.cache.invalidatePattern(`^${this.apiUrl.replace(/\//g, '\\/')}:`);
      }),
    );
  }

  updateWithImages(id: number, data: Partial<ServiceOrders>, images: File[], deleteImageIds: number[]) {
    return this.http
      .patch<ServiceOrders>(`${this.apiUrl}/${id}`, this.toFormData(data, images, deleteImageIds))
      .pipe(
        timeout(30000),
        tap((updated) => {
          const current = this.dataSubject.getValue();
          const index = current.findIndex((item) => item.id === id);
          if (index !== -1) {
            current[index] = updated;
            this.dataSubject.next([...current]);
          }
          this.selectedSubject.next(updated);
          this.cache.invalidatePattern(`^${this.apiUrl.replace(/\//g, '\\/')}:`);
        }),
      );
  }

  private toFormData(data: Partial<ServiceOrders>, images: File[] = [], deleteImageIds: number[] = []) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    deleteImageIds.forEach(id => formData.append('deleteImageIds', String(id)));
    images.forEach(file => {
      formData.append('images', file);
      formData.append('imageKinds', file.name.startsWith('customer-signature') ? 'signature' : 'image');
    });
    return formData;
  }
}
