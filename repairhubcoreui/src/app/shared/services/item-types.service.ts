import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItemTypes } from '../models/ItemTypes';
import { environment  } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class ItemTypesService {
  private apiUrl = `${environment.apiUrl}/api/item-types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ItemTypes[]> {
    return this.http.get<ItemTypes[]>(this.apiUrl);
  }

  getById(id: number): Observable<ItemTypes> {
    return this.http.get<ItemTypes>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ItemTypes>): Observable<ItemTypes> {
    return this.http.post<ItemTypes>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ItemTypes>): Observable<ItemTypes> {
    return this.http.patch<ItemTypes>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
