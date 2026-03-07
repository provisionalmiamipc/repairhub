import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface RepairAssistantChatRequest {
  serviceOrderId: string;
  question: string;
  device?: string;
  brand?: string;
  model?: string;
  defect?: string;
}

export interface RepairAssistantChatResponse {
  answer: string;
  engine: 'llm';
  serviceOrderId: string;
  lowText?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RepairAssistantLlmChatService {
  private readonly chatUrl = `${environment.apiUrl}/api/repair-assistant/chat`;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  ask(request: RepairAssistantChatRequest, pdfFile?: File): Observable<RepairAssistantChatResponse> {
    const formData = new FormData();
    formData.append('serviceOrderId', request.serviceOrderId);
    formData.append('question', request.question);
    if (request.device) formData.append('device', request.device);
    if (request.brand) formData.append('brand', request.brand);
    if (request.model) formData.append('model', request.model);
    if (request.defect) formData.append('defect', request.defect);
    if (pdfFile) formData.append('pdf', pdfFile, pdfFile.name);

    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<RepairAssistantChatResponse>(this.chatUrl, formData, { headers });
  }
}
