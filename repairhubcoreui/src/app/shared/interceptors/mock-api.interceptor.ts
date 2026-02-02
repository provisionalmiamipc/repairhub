/**
 * Mock API Interceptor
 * Intercepta requests HTTP y retorna datos mock
 * Simulable activable mediante environment.features.mockApi
 * Proporciona:
 * - Respuestas realistas con delays
 * - Soporte para CRUD operations
 * - Validación básica
 * - Errores simulados
 */

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Mock data functions - solo se usan si mockApi está habilitado
const getMockData = () => ({});
const getMockDataById = () => ({});
const createMockData = () => ({});
const updateMockData = () => ({});
const deleteMockData = () => ({});

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  private readonly mockDelay = 500; // Simular latencia de red (ms)

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Solo interceptar si está habilitado en environment
    if (!environment.features?.mockApi) {
      return next.handle(request);
    }

    // Solo interceptar requests a nuestra API
    if (!request.url.includes(environment.apiUrl)) {
      return next.handle(request);
    }

    // Log en desarrollo
    if (environment.cache?.debug) {
      console.log('[MockAPI]', request.method, request.url);
    }

    // Extraer endpoint y parámetros
    const url = request.url;
    const endpoint = this.extractEndpoint(url);
    const id = this.extractId(url);

    // Manejar diferentes métodos HTTP
    switch (request.method) {
      case 'GET':
        return this.handleGet(url, endpoint, id);
      case 'POST':
        return this.handlePost(url, endpoint, request.body);
      case 'PUT':
      case 'PATCH':
        return this.handlePut(url, endpoint, id, request.body);
      case 'DELETE':
        return this.handleDelete(url, endpoint, id);
      default:
        return next.handle(request);
    }
  }

  /**
   * Maneja requests GET
   */
  private handleGet(
    url: string,
    endpoint: string,
    id?: number
  ): Observable<HttpEvent<any>> {
    try {
      let data: any;

      if (id) {
        // GET /api/users/1 → obtener por ID
        data = getMockDataById(endpoint, id);
        if (!data) {
          return this.mockError('Not Found', 404);
        }
      } else {
        // GET /api/users → obtener lista
        // Soportar paginación query params
        const urlObj = new URL(url, 'http://localhost');
        const page = parseInt(urlObj.searchParams.get('page') || '0');
        const pageSize = parseInt(
          urlObj.searchParams.get('pageSize') || '25'
        );

        const allData = getMockData(endpoint);
        const total = allData.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = page * pageSize;
        const paginatedData = allData.slice(start, start + pageSize);

        // Retornar con estructura PagedResponse
        data = {
          data: paginatedData,
          total,
          page,
          pageSize,
          totalPages,
        };
      }

      const response = new HttpResponse({
        status: 200,
        body: data,
        url: url,
      });

      return of(response).pipe(delay(this.mockDelay));
    } catch (error: any) {
      return this.mockError(error.message, 500);
    }
  }

  /**
   * Maneja requests POST
   */
  private handlePost(
    url: string,
    endpoint: string,
    body: any
  ): Observable<HttpEvent<any>> {
    try {
      // Validaciones básicas
      if (!body || typeof body !== 'object') {
        return this.mockError('Invalid request body', 400);
      }

      // Manejo especial para verificación de PIN
      if (endpoint === 'verify-pin') {
        return this.handleVerifyPin(body);
      }

      // Crear nuevo registro
      const newRecord = createMockData(endpoint, body);

      const response = new HttpResponse({
        status: 201,
        body: newRecord,
        url: url,
      });

      if (environment.cache?.debug) {
        console.log('[MockAPI] Created:', newRecord);
      }

      return of(response).pipe(delay(this.mockDelay + 100));
    } catch (error: any) {
      return this.mockError(error.message, 400);
    }
  }

  /**
   * Maneja requests PUT/PATCH
   */
  private handlePut(
    url: string,
    endpoint: string,
    id?: number,
    body?: any
  ): Observable<HttpEvent<any>> {
    try {
      if (!id) {
        return this.mockError('ID is required for update', 400);
      }

      if (!body || typeof body !== 'object') {
        return this.mockError('Invalid request body', 400);
      }

      // Actualizar registro
      const updated = updateMockData(endpoint, id, body);

      const response = new HttpResponse({
        status: 200,
        body: updated,
        url: url,
      });

      if (environment.cache?.debug) {
        console.log('[MockAPI] Updated:', updated);
      }

      return of(response).pipe(delay(this.mockDelay + 50));
    } catch (error: any) {
      if (error.message.includes('No record found')) {
        return this.mockError(error.message, 404);
      }
      return this.mockError(error.message, 400);
    }
  }

  /**
   * Maneja requests DELETE
   */
  private handleDelete(
    url: string,
    endpoint: string,
    id?: number
  ): Observable<HttpEvent<any>> {
    try {
      if (!id) {
        return this.mockError('ID is required for delete', 400);
      }

      // Eliminar registro
      const deleted = deleteMockData(endpoint, id);

      if (!deleted) {
        return this.mockError('Record not found', 404);
      }

      const response = new HttpResponse({
        status: 204,
        body: null,
        url: url,
      });

      if (environment.cache?.debug) {
        console.log('[MockAPI] Deleted ID:', id);
      }

      return of(response).pipe(delay(this.mockDelay));
    } catch (error: any) {
      return this.mockError(error.message, 400);
    }
  }

  /**
   * Simular error HTTP
   */
  private mockError(message: string, status: number): Observable<never> {
    const errorResponse = {
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    if (environment.cache?.debug) {
      console.error('[MockAPI] Error:', errorResponse);
    }

    return throwError(() => ({
      status,
      statusText: this.getStatusText(status),
      error: errorResponse,
    }));
  }

  /**
   * Extraer endpoint del URL
   * Ej: /api/v1/users → users
   */
  private extractEndpoint(url: string): string {
    const parts = url.split('/');
    const endpoint = parts[parts.length - 1];

    // Remover query parameters
    return endpoint.split('?')[0];
  }

  /**
   * Extraer ID del URL
   * Ej: /api/v1/users/123 → 123
   */
  private extractId(url: string): number | undefined {
    const parts = url.split('/');
    const potentialId = parts[parts.length - 1];

    // Si es un número, es el ID
    if (/^\d+$/.test(potentialId)) {
      return parseInt(potentialId);
    }

    return undefined;
  }

  /**
   * Obtener descripción del status code
   */
  private getStatusText(status: number): string {
    const statuses: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
    };

    return statuses[status] || 'Unknown Error';
  }

  /**
   * Maneja la verificación de PIN para empleados
   */
  private handleVerifyPin(body: any): Observable<HttpEvent<any>> {
    try {
      console.log('[MockAPI] handleVerifyPin called with body:', body);
      
      // Validar que se envió PIN
      if (!body || !body.pin) {
        console.error('[MockAPI] PIN is missing in request body');
        return this.mockError('PIN is required', 400);
      }

      // Obtener el empleado actualmente logueado desde localStorage
      const employeeDataStr = localStorage.getItem('employee_data');
      console.log('[MockAPI] Employee data from localStorage:', employeeDataStr);
      
      if (!employeeDataStr) {
        console.error('[MockAPI] No employee_data in localStorage');
        return this.mockError('No employee session found', 401);
      }

      try {
        const currentEmployee = JSON.parse(employeeDataStr) as any;
        console.log('[MockAPI] Parsed current employee:', currentEmployee);
        
        // Obtener el empleado mock para comparar PIN
        const mockEmployee = getMockDataById('employees', currentEmployee.id) as any;
        console.log('[MockAPI] Mock employee found:', mockEmployee);
        
        if (!mockEmployee) {
          console.error('[MockAPI] Mock employee not found for ID:', currentEmployee.id);
          return this.mockError('Employee not found', 404);
        }

        // Comparar PIN (convertir ambos a string para evitar problemas de tipos)
        const mockPin = String(mockEmployee.pin);
        const inputPin = String(body.pin);
        
        console.log('[MockAPI] PIN Comparison:');
        console.log('  - Expected PIN:', mockPin, '(type:', typeof mockEmployee.pin, ')');
        console.log('  - Input PIN:', inputPin, '(type:', typeof body.pin, ')');
        console.log('  - Match:', mockPin === inputPin);
        
        if (mockPin !== inputPin) {
          console.error('[MockAPI] PIN verification failed - mismatch');
          return this.mockError('Invalid PIN', 401);
        }

        // PIN válido - retornar JWT actualizado
        console.log('[MockAPI] ✅ PIN verification SUCCESSFUL for employee:', mockEmployee.employeeCode);
        
        const fakeJWT = this.generateFakeJWT({
          id: mockEmployee.id,
          email: mockEmployee.email,
          employeeCode: mockEmployee.employeeCode,
          verified: true
        });

        const response = new HttpResponse({
          status: 200,
          body: {
            verified: true,
            access_token: fakeJWT,
            refresh_token: this.generateFakeJWT({ type: 'refresh' }),
            user: mockEmployee,
            userType: 'employee'
          },
          url: this.getUrlFromString('')
        });

        console.log('[MockAPI] Returning successful PIN verification response');
        return of(response).pipe(delay(this.mockDelay));
      } catch (e) {
        return this.mockError('Failed to verify PIN', 500);
      }
    } catch (error: any) {
      return this.mockError(error.message || 'PIN verification failed', 500);
    }
  }

  /**
   * Generar un JWT falso para testing
   * Nota: Es falso pero tiene estructura válida para testing
   */
  private generateFakeJWT(payload: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora
    }));
    const signature = 'mock_signature_' + Math.random().toString(36).substr(2, 9);
    
    return `${header}.${body}.${signature}`;
  }

  /**
   * Helper para crear URL válida
   */
  private getUrlFromString(url: string): string {
    return url || 'http://localhost:3000/api';
  }}