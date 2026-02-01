import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Devices } from '../models/Devices';
import { environment  } from '../../../environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class DevicesService extends BaseService<Devices> {
  protected apiUrl = `${environment.apiUrl}/api/devices`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
