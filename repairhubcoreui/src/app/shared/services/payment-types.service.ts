import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { PaymentTypes } from '../models/PaymentTypes';
import { environment  } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class PaymentTypesService extends BaseService<PaymentTypes> {
  protected apiUrl = `${environment.apiUrl}/api/payment-type`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
