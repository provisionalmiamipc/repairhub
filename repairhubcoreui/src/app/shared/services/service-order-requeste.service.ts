import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceOrderRequeste } from '../models/ServiceOrderRequeste';
import { environment  } from '../../../environment';


@Injectable({ providedIn: 'root' })
export class ServiceOrderRequesteService {
  private apiUrl = `${environment.apiUrl}/api/service-order-requeste`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ServiceOrderRequeste[]> {
    return this.http.get<ServiceOrderRequeste[]>(this.apiUrl);
  }

  getById(id: number): Observable<ServiceOrderRequeste> {
    return this.http.get<ServiceOrderRequeste>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ServiceOrderRequeste>): Observable<ServiceOrderRequeste> {
    return this.http.post<ServiceOrderRequeste>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ServiceOrderRequeste>): Observable<ServiceOrderRequeste> {
    return this.http.patch<ServiceOrderRequeste>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
