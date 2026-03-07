import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RepairAssistantDocument {
  id: string;
  serviceOrderId: string | null;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RepairAssistantDocumentsService {
  private readonly baseUrl = `${environment.apiUrl}/api/documents`;

  constructor(private readonly http: HttpClient) {}

  uploadMany(files: File[], serviceOrderId?: string): Observable<RepairAssistantDocument[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    if (serviceOrderId) {
      formData.append('serviceOrderId', serviceOrderId);
    }

    return this.http.post<RepairAssistantDocument[]>(`${this.baseUrl}/upload-many`, formData);
  }

  findByServiceOrder(serviceOrderId: string): Observable<RepairAssistantDocument[]> {
    return this.http.get<RepairAssistantDocument[]>(`${this.baseUrl}/service-order/${serviceOrderId}`);
  }
}
