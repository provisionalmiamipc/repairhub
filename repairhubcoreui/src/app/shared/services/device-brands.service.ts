import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { DeviceBrands } from '../models/DeviceBrands';
import { environment  } from '../../../environments/environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class DeviceBrandsService extends BaseService<DeviceBrands> {
  protected apiUrl = `${environment.apiUrl}/api/device-brands`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
