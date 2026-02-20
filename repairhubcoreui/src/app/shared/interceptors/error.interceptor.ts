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
      let errorMessage = 'An unexpected error occurred';
      
      // Manejo según código de estado HTTP
      switch (error.status) {
        case 0:
          // Connection error (no response from server)
          errorMessage = 'Could not connect to server. Check your internet connection.';
          appState.addNotification('error', errorMessage, 5000);
          break;
          
        case 401:
          // Unauthorized - Invalid or expired token
          errorMessage = 'Session expired. Please sign in again.';
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
          // Forbidden - User lacks permissions
          errorMessage = 'You do not have permission to perform this action.';
          appState.addNotification('error', errorMessage, 4000);
          break;
          
        case 404:
          // Not found
          errorMessage = error.error?.message || 'The requested resource does not exist.';
          appState.addNotification('error', errorMessage, 3000);
          break;
          
        case 422:
          // Validation error
          errorMessage = error.error?.message || 'The submitted data is not valid.';
          appState.addNotification('error', errorMessage, 4000);
          break;
          
        case 423:
          // Session locked (specific case)
          errorMessage = error.error?.message || 'Session locked. Please enter your PIN.';
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
          // Server error
          errorMessage = 'Server error. Please try again later.';
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