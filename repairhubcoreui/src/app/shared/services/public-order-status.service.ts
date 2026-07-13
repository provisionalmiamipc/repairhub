import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PublicOrderStatusTimelineItem {
  status: string;
  date: string;
}

export interface PublicOrderStatusDiagnostic {
  title: string;
  date: string;
}

export interface PublicOrderStatusReceivedPart {
  accessory: string;
  observations?: string | null;
}

export interface PublicOrderStatus {
  orderCode: string;
  createdAt: string;
  updatedAt: string;
  currentStatus: string;
  isClosed: boolean;
  isCanceled: boolean;
  device: {
    type: string;
    brand: string;
    model: string;
    serialMasked: string;
  };
  reportedIssue: string;
  timeline: PublicOrderStatusTimelineItem[];
  diagnostics: PublicOrderStatusDiagnostic[];
  receivedParts: PublicOrderStatusReceivedPart[];
  warranty: {
    available: boolean;
    duration?: string;
    endDate?: string | null;
  };
}

export interface TrackOrderRequest {
  contact: string;
  orderNumber: string;
}

@Injectable({ providedIn: 'root' })
export class PublicOrderStatusService {
  private readonly apiUrl = `${environment.apiUrl}/api/public/service-orders/status`;

  constructor(private readonly http: HttpClient) {}

  track(payload: TrackOrderRequest): Observable<PublicOrderStatus> {
    return this.http.post<PublicOrderStatus>(this.apiUrl, payload).pipe(timeout(30000));
  }
}
