import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { timeout, catchError, throwError } from 'rxjs';
import { AppStateService } from '../store/app-state.service';

/**
 * Timeout Interceptor - Limita el tiempo de espera de peticiones HTTP
 * 
 * @description
 * - Intercepta todas las peticiones HTTP
 * - Aplica timeout configurable (default: 30 segundos)
 * - Notifica al usuario cuando una petición tarda demasiado
 * - Permite configurar timeout diferente por endpoint
 * - Compatible con Angular 20+ (functional interceptor)
 * 
 * @example
 * // Registrar en app.config.ts:
 * providers: [
 *   provideHttpClient(
 *     withInterceptors([jwtInterceptor, errorInterceptor, timeoutInterceptor])
 *   )
 * ]
 */
export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const appState = inject(AppStateService);
  
  // Timeout default: 30 segundos (30000 ms)
  const DEFAULT_TIMEOUT = 30000;
  
  // Configuración de timeouts personalizados por tipo de operación
  const timeoutConfig: Record<string, number> = {
    // Upload de archivos: 2 minutos
    upload: 120000,
    // Download de reportes: 1 minuto
    download: 60000,
    // Operaciones normales: 30 segundos
    default: DEFAULT_TIMEOUT,
  };
  
  // Determinar el timeout según la URL o método
  let requestTimeout = DEFAULT_TIMEOUT;
  
  // Si la petición es POST/PUT/PATCH con FormData (upload)
  if (
    (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') &&
    req.body instanceof FormData
  ) {
    requestTimeout = timeoutConfig['upload'];
  }
  // Si la URL contiene 'export' o 'download' (descargas)
  else if (req.url.includes('/export') || req.url.includes('/download')) {
    requestTimeout = timeoutConfig['download'];
  }
  // Si la petición tiene un header personalizado para timeout
  else if (req.headers.has('X-Timeout')) {
    const customTimeout = parseInt(req.headers.get('X-Timeout') || '', 10);
    if (!isNaN(customTimeout)) {
      requestTimeout = customTimeout;
    }
  }
  
  // Aplicar timeout a la petición
  return next(req).pipe(
    timeout(requestTimeout),
    catchError((error) => {
      // Si el error es por timeout
      if (error.name === 'TimeoutError') {
        const timeoutMessage = `La petición tardó más de ${requestTimeout / 1000} segundos. Verifica tu conexión.`;
        
        // Notificar al usuario
        appState.addNotification('error', timeoutMessage, 5000);
        
        // Log en desarrollo
        if (!isProduction()) {
          console.error('HTTP Timeout:', {
            url: req.url,
            method: req.method,
            timeout: requestTimeout,
          });
        }
      }
      
      // Re-lanzar el error
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
