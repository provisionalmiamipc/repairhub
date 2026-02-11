import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AppStateService } from '../store/app-state.service';

/**
 * Error Interceptor - Manejo centralizado de errores HTTP
 * 
 * @description
 * - Intercepta todas las respuestas HTTP con error
 * - Maneja errores 401 (No autorizado) redirigiendo al login
 * - Maneja errores 403 (Prohibido) mostrando notificación
 * - Maneja errores 404 (No encontrado)
 * - Maneja errores 500 (Error del servidor)
 * - Notifica al usuario mediante el AppStateService
 * - Limpia sesión en caso de 401
 * 
 * @example
 * // Registrar en app.config.ts:
 * providers: [
 *   provideHttpClient(
 *     withInterceptors([jwtInterceptor, errorInterceptor])
 *   )
 * ]
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const appState = inject(AppStateService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';
      
      // Manejo según código de estado HTTP
      switch (error.status) {
        case 0:
          // Error de conexión (sin respuesta del servidor)
          errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
          appState.addNotification('error', errorMessage, 5000);
          break;
          
        case 401:
          // No autorizado - Token inválido o expirado
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          appState.addNotification('error', errorMessage, 3000);
          
          // Limpiar sesión del usuario
          appState.clearUserSession();
          
          // Redirigir al login después de 500ms, salvo que estemos en la página de activación
          try {
            const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
            const onActivate = pathname.startsWith('/activate');
            if (!onActivate) {
              setTimeout(() => {
                router.navigate(['/login']);
              }, 500);
            }
          } catch (e) {
            setTimeout(() => {
              router.navigate(['/login']);
            }, 500);
          }
          break;
          
        case 403:
          // Prohibido - Usuario no tiene permisos
          errorMessage = 'No tienes permisos para realizar esta acción.';
          appState.addNotification('error', errorMessage, 4000);
          break;
          
        case 404:
          // No encontrado
          errorMessage = error.error?.message || 'El recurso solicitado no existe.';
          appState.addNotification('error', errorMessage, 3000);
          break;
          
        case 422:
          // Error de validación
          errorMessage = error.error?.message || 'Los datos enviados no son válidos.';
          appState.addNotification('error', errorMessage, 4000);
          break;
          
        case 423:
          // Sesión bloqueada (caso específico)
          errorMessage = error.error?.message || 'Sesión bloqueada. Por favor, ingresa tu PIN.';
          appState.addNotification('error', errorMessage, 4000);
          break;
          
          case 429:
            // Too many requests
            errorMessage = error.error?.message || 'Too many attempts. Try again later.';
            appState.addNotification('error', errorMessage, 5000);
            break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Error del servidor
          errorMessage = 'Error del servidor. Intenta nuevamente en unos momentos.';
          appState.addNotification('error', errorMessage, 5000);
          break;
          
        default:
          // Otros errores
          errorMessage = error.error?.message || error.message || errorMessage;
          appState.addNotification('error', errorMessage, 4000);
      }
      
      // Log del error en consola (solo en desarrollo)
      if (!isProduction()) {
        console.error('HTTP Error:', {
          status: error.status,
          message: errorMessage,
          url: error.url,
          error: error.error,
        });
      }
      
      // Re-lanzar el error para que los servicios puedan manejarlo si lo necesitan
      return throwError(() => error);
    })
  );
};

/**
 * Helper para detectar entorno de producción
 */
function isProduction(): boolean {
  return localStorage.getItem('environment') === 'production';
}