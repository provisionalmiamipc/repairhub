import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse, HttpHeaders } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { timeoutInterceptor } from './timeout.interceptor';
import { AppStateService } from '../store/app-state.service';
import { TimeoutError } from 'rxjs';

describe('timeoutInterceptor', () => {
  let appStateService: jasmine.SpyObj<AppStateService>;
  let mockRequest: HttpRequest<unknown>;
  let mockNext: HttpHandlerFn;
  
  beforeEach(() => {
    // Mock del AppStateService
    appStateService = jasmine.createSpyObj('AppStateService', ['addNotification']);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: AppStateService, useValue: appStateService },
      ],
    });
    
    // Mock de HttpRequest
    mockRequest = new HttpRequest('GET', '/api/users');
    
    // Mock de HttpHandlerFn
    mockNext = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200, body: {} }))
    );
    
    // Limpiar localStorage
    localStorage.removeItem('environment');
  });
  
  it('should be created', () => {
    expect(timeoutInterceptor).toBeTruthy();
  });
  
  it('should allow request to complete within timeout', (done) => {
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(mockRequest, mockNext).subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          expect(appStateService.addNotification).not.toHaveBeenCalled();
          done();
        },
        error: () => {
          fail('Should not error when within timeout');
        },
      });
    });
  });
  
  it('should timeout and notify user if request takes too long', (done) => {
    // Simular petición que tarda más del timeout (usando timeout muy corto para test)
    const shortTimeoutRequest = new HttpRequest('GET', '/api/users', {
      headers: new HttpHeaders({ 'X-Timeout': '100' }), // 100ms timeout para test rápido
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200 })).pipe(delay(200)) // 200ms delay (más que timeout)
    );
    
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(shortTimeoutRequest, mockNext).subscribe({
        next: () => {
          fail('Should have timed out');
        },
        error: (error) => {
          expect(error.name).toBe('TimeoutError');
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            jasmine.stringContaining('segundos'),
            5000
          );
          done();
        },
      });
    });
  }, 5000); // Jasmine timeout 5s
  
  it('should use custom timeout for upload operations (FormData)', (done) => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.txt');
    
    const uploadRequest = new HttpRequest('POST', '/api/upload', formData);
    
    // No simular delay largo, solo verificar que el interceptor lo procesa
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(uploadRequest, mockNext).subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          done();
        },
        error: () => {
          fail('Upload should not timeout within configured timeout');
        },
      });
    });
  });
  
  it('should use custom timeout for download/export operations', (done) => {
    const downloadRequest = new HttpRequest('GET', '/api/users/export');
    
    TestBed.runInInjectionContext(() => {
      // Solo verificar que el interceptor procesa la petición
      timeoutInterceptor(downloadRequest, mockNext).subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          done();
        },
      });
    });
  });
  
  it('should respect custom timeout header (X-Timeout)', (done) => {
    const customRequest = new HttpRequest('GET', '/api/users', {
      headers: new HttpHeaders({ 'X-Timeout': '100' }), // 100ms custom timeout para test
    });
    
    // Simular petición que tarda 200ms (más que el custom timeout)
    mockNext = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200 })).pipe(delay(200))
    );
    
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(customRequest, mockNext).subscribe({
        next: () => {
          fail('Should have timed out with custom timeout');
        },
        error: (error) => {
          expect(error.name).toBe('TimeoutError');
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            jasmine.stringContaining('segundos'),
            5000
          );
          done();
        },
      });
    });
  }, 5000); // Jasmine timeout 5s
  
  it('should log timeout error in development mode', (done) => {
    const shortTimeoutRequest = new HttpRequest('GET', '/api/users', {
      headers: new HttpHeaders({ 'X-Timeout': '50' }), // 50ms timeout
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200 })).pipe(delay(100)) // 100ms delay
    );
    
    spyOn(console, 'error');
    
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(shortTimeoutRequest, mockNext).subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalledWith('HTTP Timeout:', jasmine.any(Object));
          done();
        },
      });
    });
  }, 5000);
  
  it('should NOT log timeout error in production mode', (done) => {
    localStorage.setItem('environment', 'production');
    
    const shortTimeoutRequest = new HttpRequest('GET', '/api/users', {
      headers: new HttpHeaders({ 'X-Timeout': '50' }), // 50ms timeout
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200 })).pipe(delay(100)) // 100ms delay
    );
    
    spyOn(console, 'error');
    
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(shortTimeoutRequest, mockNext).subscribe({
        error: (error) => {
          expect(console.error).not.toHaveBeenCalled();
          done();
        },
      });
    });
  }, 5000);
  
  it('should re-throw timeout error', (done) => {
    const shortTimeoutRequest = new HttpRequest('GET', '/api/users', {
      headers: new HttpHeaders({ 'X-Timeout': '50' }), // 50ms timeout
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(
      of(new HttpResponse({ status: 200 })).pipe(delay(100)) // 100ms delay
    );
    
    TestBed.runInInjectionContext(() => {
      timeoutInterceptor(shortTimeoutRequest, mockNext).subscribe({
        error: (error) => {
          expect(error.name).toBe('TimeoutError');
          done();
        },
      });
    });
  }, 5000);
});
