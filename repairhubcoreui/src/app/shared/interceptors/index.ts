/**
 * HTTP Interceptors - Exportaciones centralizadas
 * 
 * @description
 * Exporta todos los interceptors HTTP disponibles en la aplicación.
 * Los interceptors se ejecutan en el orden especificado en app.config.ts
 * 
 * @example
 * // En app.config.ts:
 * import { jwtInterceptor, errorInterceptor, timeoutInterceptor } from './shared/interceptors';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([jwtInterceptor, timeoutInterceptor, errorInterceptor])
 *     )
 *   ]
 * };
 */

export { jwtInterceptor } from './jwt.interceptor';
export { errorInterceptor } from './error.interceptor';
export { timeoutInterceptor } from './timeout.interceptor';
export { authInterceptor } from './auth.interceptor';
export { employeeInterceptor } from './employee.interceptor';
export { loadingInterceptor } from './loading.interceptor';
