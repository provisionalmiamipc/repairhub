import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdersItem } from '../models/OrdersItem';
import { environment  } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class OrdersItemService {
  private apiUrl = `${environment.apiUrl}/api/orders-item`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdersItem[]> {
    return this.http.get<OrdersItem[]>(this.apiUrl);
  }

  getById(id: number): Observable<OrdersItem> {
    return this.http.get<OrdersItem>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<OrdersItem>): Observable<OrdersItem> {
    return this.http.post<OrdersItem>(this.apiUrl, data);
  }

  update(id: number, data: Partial<OrdersItem>): Observable<OrdersItem> {
    return this.http.patch<OrdersItem>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
