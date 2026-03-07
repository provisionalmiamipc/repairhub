import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiagnosticNextRequest {
  serviceOrderId: string;
  device: string;
  brand?: string;
  model?: string;
  defect?: string;
  answer?: string;
}

export interface DiagnosticNextResponse {
  question: string;
  expectedAnswerType: 'yesno' | 'number' | 'text';
  nextIfYes?: string;
  nextIfNo?: string;
  hint?: string;
  currentChecklist?: string[];
  confidence: 'medium' | 'low';
}

@Injectable({
  providedIn: 'root',
})
export class RepairAssistantDiagnosticService {
  private readonly baseUrl = `${environment.apiUrl}/api/repair-assistant/diagnostic`;

  constructor(private readonly http: HttpClient) {}

  next(payload: DiagnosticNextRequest): Observable<DiagnosticNextResponse> {
    return this.http.post<DiagnosticNextResponse>(`${this.baseUrl}/next`, payload);
  }
}
