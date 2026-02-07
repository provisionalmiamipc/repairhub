import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  constructor(private http: HttpClient) {}

  /**
   * Upload a single file to the backend upload endpoint.
   * Returns the HttpEvent stream so caller can track progress and response.
   */
  uploadFile(file: File, fieldName = 'file'): Observable<HttpEvent<any>> {
    const form = new FormData();
    form.append(fieldName, file, file.name);

    const url = `${environment.apiUrl}/api/upload`;

    const req = new HttpRequest('POST', url, form, {
      reportProgress: true,
      responseType: 'json',
    });

    return this.http.request(req);
  }
}
