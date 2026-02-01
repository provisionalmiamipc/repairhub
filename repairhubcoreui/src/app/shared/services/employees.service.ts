import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Employees } from '../models/Employees';
import { environment } from '../../../environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class EmployeesService extends BaseService<Employees> {
  protected apiUrl = `${environment.apiUrl}/api/employees`;

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}
