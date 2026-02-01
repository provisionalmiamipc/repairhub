import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: Toast[] = [];
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private nextId = 1;

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  show(message: string, type: Toast['type'] = 'info', timeout = 4000): number {
    const id = this.nextId++;
    const t: Toast = { id, message, type };
    this.toasts.push(t);
    this.toasts$.next([...this.toasts]);
    if (timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }
    return id;
  }

  success(message: string, timeout = 4000) { return this.show(message, 'success', timeout); }
  error(message: string, timeout = 4000) { return this.show(message, 'error', timeout); }
  info(message: string, timeout = 4000) { return this.show(message, 'info', timeout); }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next([...this.toasts]);
  }

  clear() {
    this.toasts = [];
    this.toasts$.next([]);
  }
}
