import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { ServiceOrders } from '../models/ServiceOrders';
import { environment } from '../../../environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService extends BaseService<ServiceOrders> {
  protected apiUrl = `${environment.apiUrl}/api/service-orders`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
