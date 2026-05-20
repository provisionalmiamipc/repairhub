import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly apiUrl = `${environment.apiUrl}/api/media`;

  constructor(private readonly http: HttpClient) {}

  getVariantUrl(id: number, variant: 'thumbnail' | 'display' = 'display') {
    return this.http
      .get<{ url: string }>(`${this.apiUrl}/${id}/url`, {
        params: { variant },
      })
      .pipe(timeout(30000));
  }
}
