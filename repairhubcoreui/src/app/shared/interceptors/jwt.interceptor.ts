import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppStateService } from '../store/app-state.service';

/**
 * JWT Interceptor - Inyecta el token de autenticación en todas las peticiones HTTP
 * 
 * @description
 * - Intercepta todas las peticiones HTTP salientes
 * - Agrega el header Authorization con el token JWT si existe sesión activa
 * - Excluye endpoints públicos (login, register, health)
 * - Compatible con Angular 20+ (functional interceptor)
 * 
 * @example
 * // Registrar en app.config.ts:
 * providers: [
 *   provideHttpClient(
 *     withInterceptors([jwtInterceptor, errorInterceptor])
 *   )
 * ]
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const appState = inject(AppStateService);
  
  // Lista de endpoints públicos que NO requieren token
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/health',
    '/api/public',
  ];
  
  // Verificar si la URL es pública
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );
  
  // Si es endpoint público, continuar sin modificar
  if (isPublicEndpoint) {
    return next(req);
  }
  
  // Obtener sesión del usuario desde el estado global
  const userSession = appState.snapshot.user;
  
  // Si no hay sesión o token, continuar sin modificar
  if (!userSession?.id) {
    return next(req);
  }
  
  // TODO: Implementar extracción de token cuando AuthService esté completo
  // Por ahora, usar un token mock o del localStorage
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return next(req);
  }
  
  // Clonar la petición y agregar el header Authorization
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  // Continuar con la petición modificada
  return next(clonedRequest);
};
