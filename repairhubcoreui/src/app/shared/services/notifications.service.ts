import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Notifications } from '../models/Notifications';
import { environment  } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  notifications = signal<any[]>([]);
  unreadCount = signal(0);
  private socket?: Socket;

  constructor(private http: HttpClient) {
    //this.socket = io('/'); // ajustar URL
    //this.socket.on('notification', (n) => this.prepend(n));
  }

  connect(employeeId?: number) {
    if (!this.socket) {
      const url = environment.apiUrl; // ajustar si hace falta
      const token = localStorage.getItem('employee_token') || localStorage.getItem('auth_token');
      this.socket = io(url, { auth: { token } });
      this.socket.on('notification', (n: Notifications) => this.prepend(n));
    }
    // Server will automatically join the socket to the employee room when token is valid.
    // Keep optional manual join for backwards compatibility (it will be ignored server-side).
    if (employeeId && this.socket) {
      this.socket.emit('join', { employeeId });
    }
  }

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

  async loadMy(employeeId?: number) {
    const url = `${this.apiUrl}/me?limit=100&offset=0`;
    const res = await this.http.get<{ items: Notifications[]; total: number; unreadCount: number }>(url).toPromise();
    const list = res?.items || [];
    // Deduplicate by numeric id (keep first occurrence)
    const unique: Notifications[] = [];
    const seen = new Set<number>();
    for (const it of list) {
      const idNum = Number((it as any).id);
      if (!seen.has(idNum)) {
        seen.add(idNum);
        unique.push(it);
      }
    }
    console.debug('[NotificationsService] loadMy fetched', { url, total: res?.total, fetched: list.length, unique: unique.length });
    this.notifications.set(unique);
    this.unreadCount.set(res?.unreadCount ?? (unique.filter(n => n.status === 'unread').length));
    // ensure socket connected (server will derive employee from token)
    this.connect(employeeId);
  }

  prepend(n: Notifications) {
    // Prevent duplicates: compare numeric ids to avoid type mismatches
    const idNum = Number((n as any).id);
    const list = this.notifications();
    const exists = list.some(i => Number(i.id) === idNum);
    if (exists) {
      // place new/updated item at the front and remove existing duplicates
      const newList = [n, ...list.filter(i => Number(i.id) !== idNum)];
      this.notifications.set(newList);
      console.debug('[NotificationsService] prepend updated existing notification', { id: idNum });
    } else {
      this.notifications.update(l => [n, ...l]);
      console.debug('[NotificationsService] prepend added new notification', { id: idNum });
    }
    this.unreadCount.set(this.notifications().filter(r => r.status === 'unread').length);
  }

  async markRead(id: number): Promise<Notifications> {
    const updated = await firstValueFrom(this.update(id, { status: 'read' }));
    this.notifications.update(list => list.map(i => i.id === id ? updated : i));
    this.unreadCount.set(this.notifications().filter(r => r.status === 'unread').length);
    return updated;
  }

}

