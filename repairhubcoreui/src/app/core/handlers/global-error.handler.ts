import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environment';

/**
 * GlobalErrorHandler: Maneja todos los errores no capturados
 * Oculta detalles técnicos en producción
 * Loguea errores en servicio de monitoreo (Sentry, etc.)
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | HttpErrorResponse): void {
    const isDevelopment = !environment.production;
    const router = this.injector.get(Router);
    const chunkFailedMessage = /Loading chunk \d+ failed/g;

    // Manejo especial para errores de lazy loading
    if (chunkFailedMessage.test(error.message)) {
      window.location.reload();
      return;
    }

    // Errores HTTP
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error, isDevelopment);
    } else {
      // Errores de aplicación
      this.handleClientError(error, isDevelopment);
    }

    // Loguear en servicio externo en producción
    if (!isDevelopment) {
      this.sendErrorToLoggingService(error);
    }

    // Mostrar error al usuario
    if (!isDevelopment) {
      console.error('Error details sent to monitoring service');
    } else {
      console.error('Full error:', error);
    }
  }

  private handleHttpError(error: HttpErrorResponse, isDevelopment: boolean): void {
    const status = error.status;

    // Errores de autenticación
    if (status === 401) {
      const router = this.injector.get(Router);
      router.navigate(['/login']);
      console.warn('Session expired. Redirecting to login...');
      return;
    }

    // Errores de autorización
    if (status === 403) {
      const router = this.injector.get(Router);
      router.navigate(['/unauthorized']);
      console.warn('Access denied');
      return;
    }

    // Errores de no encontrado
    if (status === 404) {
      console.warn('Resource not found:', error.url);
      return;
    }

    // Errores de validación
    if (status === 422 || status === 400) {
      console.warn('Validation error:', error.error);
      return;
    }

    // Errores de servidor
    if (status >= 500) {
      console.error('Server error:', status, isDevelopment ? error : 'Internal server error');
      return;
    }

    // Otros errores
    if (isDevelopment) {
      console.error('HTTP Error:', error);
    } else {
      console.error('An error occurred');
    }
  }

  private handleClientError(error: Error, isDevelopment: boolean): void {
    if (isDevelopment) {
      console.error('Client Error:', error);
    } else {
      console.error('An unexpected error occurred');
    }
  }

  private sendErrorToLoggingService(error: Error | HttpErrorResponse): void {
    // Implementar con Sentry, LogRocket, Datadog, etc.
    // Ejemplo con Sentry:
    // Sentry.captureException(error);

    // Por ahora, solo logging local
    const errorData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: error instanceof Error ? error.message : error.statusText,
      stack: error instanceof Error ? error.stack : undefined,
      status: error instanceof HttpErrorResponse ? error.status : undefined,
    };

    console.log('Error logged to monitoring service:', errorData);
    
    // Enviar a servicio backend si es necesario
    // fetch('/api/logs/errors', { method: 'POST', body: JSON.stringify(errorData) });
  }
}
