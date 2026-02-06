import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SOItems } from '../models/SOItems';
import { environment  } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SOItemsService {
  private apiUrl = `${environment.apiUrl}/api/s-o-items`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SOItems[]> {
    return this.http.get<SOItems[]>(this.apiUrl);
  }

  getById(id: number): Observable<SOItems> {
    return this.http.get<SOItems>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<SOItems>): Observable<SOItems> {
    return this.http.post<SOItems>(this.apiUrl, data);
  }

  update(id: number, data: Partial<SOItems>): Observable<SOItems> {
    return this.http.patch<SOItems>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
