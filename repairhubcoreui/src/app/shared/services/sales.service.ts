import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sales } from '../models/Sales';
import { environment  } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private apiUrl = `${environment.apiUrl}/api/sales`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Sales[]> {
    return this.http.get<Sales[]>(this.apiUrl);
  }

  getById(id: number): Observable<Sales> {
    return this.http.get<Sales>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Sales>): Observable<Sales> {
    return this.http.post<Sales>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Sales>): Observable<Sales> {
    return this.http.patch<Sales>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
