import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Centers } from '../models/Centers';
import { environment  } from '../../../environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class CentersService extends BaseService<Centers> {
  protected apiUrl = `${environment.apiUrl}/api/centers`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
