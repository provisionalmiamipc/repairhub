import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleItems } from '../models/SaleItems';
import { environment  } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SaleItemsService {
  private apiUrl = `${environment.apiUrl}/api/sale-items`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SaleItems[]> {
    return this.http.get<SaleItems[]>(this.apiUrl);
  }

  getById(id: number): Observable<SaleItems> {
    return this.http.get<SaleItems>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<SaleItems>): Observable<SaleItems> {
    return this.http.post<SaleItems>(this.apiUrl, data);
  }

  update(id: number, data: Partial<SaleItems>): Observable<SaleItems> {
    return this.http.patch<SaleItems>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
