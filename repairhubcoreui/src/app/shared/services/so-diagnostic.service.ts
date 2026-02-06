import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SODiagnostic } from '../models/SODiagnostic';
import { environment  } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SODiagnosticService {
  private apiUrl = `${environment.apiUrl}/api/s-o-diagnostic`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SODiagnostic[]> {
    return this.http.get<SODiagnostic[]>(this.apiUrl);
  }

  getById(id: number): Observable<SODiagnostic> {
    return this.http.get<SODiagnostic>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<SODiagnostic>): Observable<SODiagnostic> {
    return this.http.post<SODiagnostic>(this.apiUrl, data);
  }

  update(id: number, data: Partial<SODiagnostic>): Observable<SODiagnostic> {
    return this.http.patch<SODiagnostic>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
