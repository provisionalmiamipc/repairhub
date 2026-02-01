import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceTypes } from '../models/ServiceTypes';
import { environment  } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class ServiceTypesService {
  private apiUrl = `${environment.apiUrl}/api/service-type`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServiceTypes[]> {
    return this.http.get<ServiceTypes[]>(this.apiUrl);
  }

  getById(id: number): Observable<ServiceTypes> {
    return this.http.get<ServiceTypes>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ServiceTypes>): Observable<ServiceTypes> {
    return this.http.post<ServiceTypes>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ServiceTypes>): Observable<ServiceTypes> {
    return this.http.patch<ServiceTypes>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
