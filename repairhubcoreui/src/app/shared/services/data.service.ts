// services/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  // Automatically filter data by centerId and storeId
  getStoreData(): Observable<any> {
    const centerId = this.authService.getCenterId();
    const storeId = this.authService.getStoreId();
    
    let params = new HttpParams();
    if (centerId) params = params.set('centerId', centerId.toString());
    if (storeId) params = params.set('storeId', storeId.toString());
    
    return this.http.get('/api/store-data', { params });
  }

  getCenterData(): Observable<any> {
    const centerId = this.authService.getCenterId();
    
    let params = new HttpParams();
    if (centerId) params = params.set('centerId', centerId.toString());
    
    return this.http.get('/api/center-data', { params });
  }

  getFinancialReports(): Observable<any> {
    const centerId = this.authService.getCenterId();
    const storeId = this.authService.getStoreId();
    
    let params = new HttpParams();
    if (centerId) params = params.set('centerId', centerId.toString());
    if (storeId) params = params.set('storeId', storeId.toString());
    
    return this.http.get('/api/financial/reports', { params });
  }

  getInventoryData(): Observable<any> {
    const centerId = this.authService.getCenterId();
    const storeId = this.authService.getStoreId();
    
    let params = new HttpParams();
    if (centerId) params = params.set('centerId', centerId.toString());
    if (storeId) params = params.set('storeId', storeId.toString());
    
    return this.http.get('/api/inventory', { params });
  }
}