import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Customers } from '../models/Customers';
import { environment } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class CustomersService extends BaseService<Customers> {
  protected apiUrl = `${environment.apiUrl}/api/customers`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
