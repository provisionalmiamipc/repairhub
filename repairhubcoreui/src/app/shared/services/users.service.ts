import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Users } from '../models/Users';
import { environment } from '../../../environment';
import { CacheManagerService } from '../store/cache-manager.service';

@Injectable({ providedIn: 'root' })
export class UsersService extends BaseService<Users> {
  protected apiUrl = `${environment.apiUrl}/api/user`; // Singular: /user no /users

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }

  /**
   * Verificar si un email ya existe
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-email/${email}`);
  }

  /**
   * Obtener usuarios activos
   */
  getActive(): Observable<Users[]> {
    return this.http.get<Users[]>(`${this.apiUrl}?active=true`);
  }
}
