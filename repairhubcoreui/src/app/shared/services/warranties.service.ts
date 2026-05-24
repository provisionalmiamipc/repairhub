import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { BaseService } from './base.service';
import { Warranty } from '../models/Warranty';
import { ServiceOrders } from '../models/ServiceOrders';
import { environment } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class WarrantiesService extends BaseService<Warranty> {
  protected apiUrl = `${environment.apiUrl}/api/warranties`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }

  getByServiceOrder(serviceOrderId: number) {
    return this.http.get<Warranty[]>(`${this.apiUrl}/service-order/${serviceOrderId}`).pipe(timeout(30000));
  }

  createFromServiceOrder(serviceOrderId: number, createdById?: number | null) {
    return this.http
      .post<Warranty>(`${this.apiUrl}/from-service-order/${serviceOrderId}`, { createdById })
      .pipe(timeout(30000));
  }

  voidWarranty(id: number, data: { warrantyVoidReason: string; warrantyVoidNotes?: string; voidedById?: number | null }) {
    return this.http.patch<Warranty>(`${this.apiUrl}/${id}/void`, data).pipe(timeout(30000));
  }

  createWarrantyOrder(id: number, data: { assignedTechId?: number | null; createdById?: number | null; noteReception?: string } = {}) {
    return this.http.post<ServiceOrders>(`${this.apiUrl}/${id}/service-order`, data).pipe(timeout(30000));
  }
}
