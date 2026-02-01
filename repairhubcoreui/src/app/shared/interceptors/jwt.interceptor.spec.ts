import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { jwtInterceptor } from './jwt.interceptor';
import { AppStateService } from '../store/app-state.service';

describe('jwtInterceptor', () => {
  let appStateService: jasmine.SpyObj<AppStateService>;
  let mockRequest: HttpRequest<unknown>;
  let mockNext: HttpHandlerFn;
  
  beforeEach(() => {
    // Mock del AppStateService
    appStateService = jasmine.createSpyObj('AppStateService', [], {
      snapshot: {
        user: null,
        ui: { sidebarCollapsed: false, theme: 'light', currentModule: null, notifications: [] },
        cache: {},
        filters: {},
        offline: false,
        lastSyncTime: null,
      },
    });
    
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
    localStorage.clear();
  });
  
  afterEach(() => {
    localStorage.clear();
  });
  
  it('should be created', () => {
    expect(jwtInterceptor).toBeTruthy();
  });
  
  it('should NOT add Authorization header for public endpoints (login)', () => {
    const loginRequest = new HttpRequest('POST', '/auth/login', { email: 'test@test.com', password: '123' });
    
    TestBed.runInInjectionContext(() => {
      jwtInterceptor(loginRequest, mockNext);
    });
    
    expect(mockNext).toHaveBeenCalledWith(loginRequest);
    expect(mockNext).toHaveBeenCalledTimes(1);
    
    // Verificar que NO se modificó la petición
    const calledRequest = (mockNext as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(calledRequest.headers.has('Authorization')).toBeFalse();
  });
  
  it('should NOT add Authorization header for public endpoints (register)', () => {
    const registerRequest = new HttpRequest('POST', '/auth/register', { email: 'test@test.com' });
    
    TestBed.runInInjectionContext(() => {
      jwtInterceptor(registerRequest, mockNext);
    });
    
    const calledRequest = (mockNext as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(calledRequest.headers.has('Authorization')).toBeFalse();
  });
  
  it('should NOT add Authorization header if no user session exists', () => {
    TestBed.runInInjectionContext(() => {
      jwtInterceptor(mockRequest, mockNext);
    });
    
    const calledRequest = (mockNext as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(calledRequest.headers.has('Authorization')).toBeFalse();
  });
  
  it('should NOT add Authorization header if no token in localStorage', () => {
    // Simular sesión activa pero sin token
    Object.defineProperty(appStateService, 'snapshot', {
      get: () => ({
        user: { id: 1, email: 'test@test.com', firstName: 'Test', lastName: 'User', roles: [], permissions: [], lastActivity: new Date(), expiresAt: null },
        ui: { sidebarCollapsed: false, theme: 'light', currentModule: null, notifications: [] },
        cache: {},
        filters: {},
        offline: false,
        lastSyncTime: null,
      }),
    });
    
    TestBed.runInInjectionContext(() => {
      jwtInterceptor(mockRequest, mockNext);
    });
    
    const calledRequest = (mockNext as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(calledRequest.headers.has('Authorization')).toBeFalse();
  });
  
  it('should ADD Authorization header if user session exists and token is in localStorage', () => {
    // Simular sesión activa
    Object.defineProperty(appStateService, 'snapshot', {
      get: () => ({
        user: { id: 1, email: 'test@test.com', firstName: 'Test', lastName: 'User', roles: [], permissions: [], lastActivity: new Date(), expiresAt: null },
        ui: { sidebarCollapsed: false, theme: 'light', currentModule: null, notifications: [] },
        cache: {},
        filters: {},
        offline: false,
        lastSyncTime: null,
      }),
    });
    
    // Agregar token al localStorage
    localStorage.setItem('access_token', 'mock-jwt-token-12345');
    
    TestBed.runInInjectionContext(() => {
      jwtInterceptor(mockRequest, mockNext);
    });
    
    const calledRequest = (mockNext as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(calledRequest.headers.has('Authorization')).toBeTrue();
    expect(calledRequest.headers.get('Authorization')).toBe('Bearer mock-jwt-token-12345');
  });
  
  it('should clone request correctly when adding Authorization header', () => {
    Object.defineProperty(appStateService, 'snapshot', {
      get: () => ({
        user: { id: 1, email: 'test@test.com', firstName: 'Test', lastName: 'User', roles: [], permissions: [], lastActivity: new Date(), expiresAt: null },
        ui: { sidebarCollapsed: false, theme: 'light', currentModule: null, notifications: [] },
        cache: {},
        filters: {},
        offline: false,
        lastSyncTime: null,
      }),
    });
    
    localStorage.setItem('access_token', 'test-token');
    
    TestBed.runInInjectionContext(() => {
      jwtInterceptor(mockRequest, mockNext);
    });
    
    const calledRequest = (mockNext as jasmine.Spy).calls.mostRecent().args[0] as HttpRequest<unknown>;
    
    // Verificar que es una nueva instancia (clonada)
    expect(calledRequest).not.toBe(mockRequest);
    
    // Verificar que mantiene propiedades originales
    expect(calledRequest.method).toBe(mockRequest.method);
    expect(calledRequest.url).toBe(mockRequest.url);
  });
});
