import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { AppStateService } from '../store/app-state.service';

describe('errorInterceptor', () => {
  let appStateService: jasmine.SpyObj<AppStateService>;
  let router: jasmine.SpyObj<Router>;
  let mockRequest: HttpRequest<unknown>;
  let mockNext: HttpHandlerFn;
  
  beforeEach(() => {
    // Mock del AppStateService
    appStateService = jasmine.createSpyObj('AppStateService', ['addNotification', 'clearUserSession']);
    
    // Mock del Router
    router = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: AppStateService, useValue: appStateService },
        { provide: Router, useValue: router },
      ],
    });
    
    // Mock de HttpRequest
    mockRequest = new HttpRequest('GET', '/api/users');
    
    // Mock de HttpHandlerFn (por defecto no retorna error)
    mockNext = jasmine.createSpy('next');
    
    // Limpiar localStorage
    localStorage.removeItem('environment');
  });
  
  it('should be created', () => {
    expect(errorInterceptor).toBeTruthy();
  });
  
  it('should handle 401 error (Unauthorized) - clear session and redirect to login', (done) => {
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Invalid token' },
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          // Verificar que se llamó clearUserSession
          expect(appStateService.clearUserSession).toHaveBeenCalledTimes(1);
          
          // Verificar que se agregó notificación
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            jasmine.stringContaining('Sesión expirada'),
            3000
          );
          
          // Verificar que se redirige al login (setTimeout, así que hay que esperar)
          setTimeout(() => {
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
            done();
          }, 600);
        },
      });
    });
  });
  
  it('should handle 403 error (Forbidden)', (done) => {
    const error = new HttpErrorResponse({
      status: 403,
      statusText: 'Forbidden',
      error: { message: 'Access denied' },
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          // Verificar que se agregó notificación
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            jasmine.stringContaining('No tienes permisos'),
            4000
          );
          
          // NO debe limpiar sesión ni redirigir
          expect(appStateService.clearUserSession).not.toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
          
          done();
        },
      });
    });
  });
  
  it('should handle 404 error (Not Found)', (done) => {
    const error = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: { message: 'User not found' },
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            'User not found',
            3000
          );
          done();
        },
      });
    });
  });
  
  it('should handle 500 error (Internal Server Error)', (done) => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            jasmine.stringContaining('Error del servidor'),
            5000
          );
          done();
        },
      });
    });
  });
  
  it('should handle network error (status 0)', (done) => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            jasmine.stringContaining('No se pudo conectar al servidor'),
            5000
          );
          done();
        },
      });
    });
  });
  
  it('should handle 422 validation error', (done) => {
    const error = new HttpErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      error: { message: 'Email is required' },
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          expect(appStateService.addNotification).toHaveBeenCalledWith(
            'error',
            'Email is required',
            4000
          );
          done();
        },
      });
    });
  });
  
  it('should re-throw error after handling', (done) => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });
  
  it('should NOT log to console in production environment', (done) => {
    localStorage.setItem('environment', 'production');
    
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    mockNext = jasmine.createSpy('next').and.returnValue(throwError(() => error));
    
    spyOn(console, 'error');
    
    TestBed.runInInjectionContext(() => {
      errorInterceptor(mockRequest, mockNext).subscribe({
        error: (err) => {
          expect(console.error).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
