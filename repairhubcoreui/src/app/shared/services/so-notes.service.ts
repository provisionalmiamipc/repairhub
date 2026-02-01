import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SONotes } from '../models/SONotes';
import { environment  } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class SONotesService {
  private apiUrl = `${environment.apiUrl}/api/s-o-notes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SONotes[]> {
    return this.http.get<SONotes[]>(this.apiUrl);
  }

  getById(id: number): Observable<SONotes> {
    return this.http.get<SONotes>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<SONotes>): Observable<SONotes> {
    return this.http.post<SONotes>(this.apiUrl, data);
  }

  update(id: number, data: Partial<SONotes>): Observable<SONotes> {
    return this.http.patch<SONotes>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
