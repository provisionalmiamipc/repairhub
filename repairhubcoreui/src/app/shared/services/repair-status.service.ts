import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { RepairStatus } from '../models/RepairStatus';
import { environment  } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class RepairStatusService extends BaseService<RepairStatus> {
  protected apiUrl = `${environment.apiUrl}/api/repair-status`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
