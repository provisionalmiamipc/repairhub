import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

/**
 * CSRF Interceptor: Agrega token CSRF a requests que modifican datos
 * Angular maneja el XSRF automáticamente si se configura withXsrfConfiguration
 * Este interceptor es respaldo manual en caso necesario
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Methods que requieren CSRF protection
  const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!unsafeMethods.includes(req.method)) {
    return next(req);
  }

  // Si ya tiene header XSRF (Angular lo agregó), pasar
  if (req.headers.has('X-XSRF-TOKEN')) {
    return next(req);
  }

  // Intentar obtener token de cookie (Angular lo puso ahí)
  const token = getCsrfTokenFromCookie();
  
  if (token) {
    // Clonar request y agregar header
    const clonedReq = req.clone({
      headers: req.headers.set('X-XSRF-TOKEN', token)
    });
    return next(clonedReq);
  }

  // Si no hay token CSRF, permitir (confiar en Angular's automatic handling)
  return next(req);
};

/**
 * Extraer token CSRF de cookie
 * Función auxiliar
 */
function getCsrfTokenFromCookie(): string | null {
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }

  return null;
}
