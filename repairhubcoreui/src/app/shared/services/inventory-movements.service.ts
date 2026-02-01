import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { InventoryMovements } from '../models/InventoryMovements';
import { environment } from '../../../environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class InventoryMovementsService extends BaseService<InventoryMovements> {
  protected apiUrl = `${environment.apiUrl}/api/inventory-movements`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
