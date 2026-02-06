import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notifications } from '../models/Notifications';
import { environment  } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/api/Notifications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Notifications[]> {
    return this.http.get<Notifications[]>(this.apiUrl);
  }

  getById(id: number): Observable<Notifications> {
    return this.http.get<Notifications>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Notifications>): Observable<Notifications> {
    return this.http.post<Notifications>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Notifications>): Observable<Notifications> {
    return this.http.patch<Notifications>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

