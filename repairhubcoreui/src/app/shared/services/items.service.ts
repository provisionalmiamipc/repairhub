import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Items } from '../models/Items';
import { environment  } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class ItemsService extends BaseService<Items> {
  protected apiUrl = `${environment.apiUrl}/api/item`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
