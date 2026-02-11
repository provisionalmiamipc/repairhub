// interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable, BehaviorSubject, filter, take, finalize, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isAuthRequest(req)) {
    return next(req);
  }

  const authReq = addAuthHeader(req, authService);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function isAuthRequest(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/auth/login') || 
         req.url.includes('/auth/refresh') ||
         req.url.includes('/public/');
}

function addAuthHeader(req: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  const token = authService.getToken();
  
  if (token) {
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  
  return req;
}

function handle401Error(
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn, 
  authService: AuthService, 
  router: Router
): Observable<any> {
  // refresh token is now stored as httpOnly cookie; do not read it from localStorage

  // Single refresh in progress pattern
  // keep a global flag/subject in module scope
  // (these are initialized on first use)
  (handle401Error as any)._refreshInProgress = (handle401Error as any)._refreshInProgress ?? false;
  (handle401Error as any)._refreshSubject = (handle401Error as any)._refreshSubject ?? new BehaviorSubject<string | null>(null);

  const refreshInProgress: boolean = (handle401Error as any)._refreshInProgress;
  const refreshSubject: BehaviorSubject<string | null> = (handle401Error as any)._refreshSubject;

  if (!refreshInProgress) {
    // start the refresh
    (handle401Error as any)._refreshInProgress = true;
    // call refresh endpoint
  // call refresh endpoint — AuthService will send cookie (withCredentials)
  return authService.refreshToken().pipe(
      switchMap((token: any) => {
        // token is normalized to { accessToken, refreshToken }
        authService.storeNewToken(token);
        // notify waiting requests
        refreshSubject.next(token.accessToken || token?.accessToken || token?.access_token || authService.getToken());
        const newReq = addAuthHeader(req, authService);
        return next(newReq);
      }),
      catchError((err) => {
        // propagate error to waiters and logout
        refreshSubject.next(null);
        authService.logout();
        // If the user is currently on the activation page, avoid forcing a redirect
        // so they can complete account activation. Otherwise, force reload to /login.
        try {
          const pathname = window.location.pathname || '';
          const onActivate = pathname.startsWith('/activate');
          if (!onActivate) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        } catch (e) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        return throwError(() => err);
      }),
      finalize(() => {
        (handle401Error as any)._refreshInProgress = false;
      })
    );
  } else {
    // wait for the refresh to finish
    return (handle401Error as any)._refreshSubject.pipe(
      filter((token: string | null) => token !== null),
      take(1),
      switchMap(() => {
        const newReq = addAuthHeader(req, authService);
        return next(newReq);
      })
    );
  }
}