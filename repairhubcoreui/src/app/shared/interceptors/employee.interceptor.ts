// interceptors/employee.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const employeeInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  if (authService.getUserType() === 'employee' && !isAuthRequest(req)) {
    const employeeReq = addEmployeeHeaders(req, authService);
    return next(employeeReq);
  }

  return next(req);
};

function isAuthRequest(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/auth/');
}

function addEmployeeHeaders(req: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  const employeeId = authService.getEmployeeId();
  const centerId = authService.getCenterId();
  const storeId = authService.getStoreId();
  const role = authService.getCurrentEmployeeRole();

  let headers = req.headers;

  if (employeeId) headers = headers.set('X-Employee-Id', employeeId.toString());
  if (centerId) headers = headers.set('X-Center-Id', centerId.toString());
  if (storeId) headers = headers.set('X-Store-Id', storeId.toString());
  if (role) headers = headers.set('X-Employee-Role', role);

  return req.clone({ headers });
}