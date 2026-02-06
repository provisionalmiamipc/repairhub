import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Stores } from '../models/Stores';
import { environment  } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class StoresService extends BaseService<Stores> {
  protected apiUrl = `${environment.apiUrl}/api/stores`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
