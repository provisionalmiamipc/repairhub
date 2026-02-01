// interceptors/loading.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs/operators';

export const loadingInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const loadingService = inject(LoadingService);

  if (shouldSkipLoading(req)) {
    return next(req);
  }

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};

function shouldSkipLoading(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/auth/verify-pin') || 
         (req.method === 'GET' && req.url.includes('/small-data'));
}