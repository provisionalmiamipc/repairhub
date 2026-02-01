import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointments } from '../models/Appointments';
import { environment  } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private apiUrl = `${environment.apiUrl}/api/appointments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Appointments[]> {
    return this.http.get<Appointments[]>(this.apiUrl);
  }

  getById(id: number): Observable<Appointments> {
    return this.http.get<Appointments>(`${this.apiUrl}/${id}`);
  }

  create(appointment: Appointments): Observable<Appointments> {
    return this.http.post<Appointments>(this.apiUrl, appointment);
  }

  update(id: number, appointment: Appointments): Observable<Appointments> {
    return this.http.patch<Appointments>(`${this.apiUrl}/${id}`, appointment);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
