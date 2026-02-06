import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Orders } from '../models/Orders';
import { environment } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class OrdersService extends BaseService<Orders> {
  protected apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
