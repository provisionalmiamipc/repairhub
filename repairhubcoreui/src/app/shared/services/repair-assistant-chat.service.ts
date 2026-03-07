import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatHistoryMessage {
  id: number;
  serviceOrderId: number;
  content: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RepairAssistantChatService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private readonly http: HttpClient) {}

  getHistory(serviceOrderId: string): Observable<ChatHistoryMessage[]> {
    return this.http.get<ChatHistoryMessage[]>(`${this.baseUrl}/service-orders/${serviceOrderId}/chat`);
  }
}
