import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import {
  catchError,
  tap,
  finalize,
  map,
  retry,
  timeout,
  retryWhen,
  mergeMap,
} from 'rxjs/operators';
import { CacheManagerService } from '../store/cache-manager.service';

export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * BaseService genérico para CRUD operations
 * Proporciona:
 * - Manejo de estados (loading, error, data)
 * - Observables reactivos
 * - Retry automático
 * - Timeout configurado
 * - Error handling estandarizado
 * - Smart caching con TTL configurable
 * - Invalidación automática en mutaciones
 */
@Injectable({ providedIn: 'root' })
export abstract class BaseService<T extends { id: number }> {
  protected abstract apiUrl: string;

  // Estados reactivos
  protected dataSubject = new BehaviorSubject<T[]>([]);
  protected loadingSubject = new BehaviorSubject<boolean>(false);
  protected errorSubject = new BehaviorSubject<string | null>(null);
  protected selectedSubject = new BehaviorSubject<T | null>(null);

  // Observables públicos
  data$ = this.dataSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  selected$ = this.selectedSubject.asObservable();

  // Configuración
  protected readonly DEFAULT_TIMEOUT = 30000; // 30 segundos
  protected readonly DEFAULT_RETRY_COUNT = 3;
  protected readonly DEFAULT_RETRY_DELAY = 1000;
  protected readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    protected http: HttpClient,
    protected cache: CacheManagerService
  ) {}

  /**
   * Obtener todos los registros
   * @param useCache - Si true, intenta obtener del caché primero (default: true)
   * @param cacheTtl - TTL del caché en milisegundos (default: 5 minutos)
   */
  getAll(useCache: boolean = true, cacheTtl?: number): Observable<T[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const cacheKey = `${this.apiUrl}:all`;
    const ttl = cacheTtl || this.DEFAULT_CACHE_TTL;

    // Si caching está habilitado, usar CacheManager
    if (useCache) {
      return this.cache.get(
        cacheKey,
        () => this.fetchAll(),
        ttl
      ).pipe(
        tap((data) => this.dataSubject.next(data)),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
    }

    // Sin cache, fetch directo
    return this.fetchAll();
  }

  /**
   * Fetch interno para getAll (sin cache)
   */
  private fetchAll(): Observable<T[]> {
    return this.http
      .get<T[]>(this.apiUrl)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retryWhen((errors) =>
          errors.pipe(
            mergeMap((error, index) => {
              // No reintentar errores de conexión (status 0) o errores de cliente (4xx)
              if (error.status === 0 || (error.status >= 400 && error.status < 500)) {
                return throwError(() => error);
              }
              // Reintentar hasta 2 veces para errores del servidor (5xx) o timeout
              if (index < 2) {
                return timer(this.DEFAULT_RETRY_DELAY * (index + 1));
              }
              return throwError(() => error);
            })
          )
        ),
        tap((data) => {
          this.dataSubject.next(data);
        }),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Obtener registros con paginación
   */
  getAllPaginated(page: number = 1, pageSize: number = 10): Observable<PagedResponse<T>> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
    });

    return this.http
      .get<PagedResponse<T>>(`${this.apiUrl}?${params}`)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retryWhen((errors) =>
          errors.pipe(
            mergeMap((error, index) => {
              // No reintentar errores de conexión (status 0) o errores de cliente (4xx)
              if (error.status === 0 || (error.status >= 400 && error.status < 500)) {
                return throwError(() => error);
              }
              // Reintentar hasta 2 veces para errores del servidor (5xx) o timeout
              if (index < 2) {
                return timer(this.DEFAULT_RETRY_DELAY * (index + 1));
              }
              return throwError(() => error);
            })
          )
        ),
        tap((response) => {
          this.dataSubject.next(response.data);
        }),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Obtener un registro por ID
   * @param id - ID del registro
   * @param useCache - Si true, intenta obtener del caché primero (default: true)
   * @param cacheTtl - TTL del caché en milisegundos (default: 5 minutos)
   */
  getById(id: number, useCache: boolean = true, cacheTtl?: number): Observable<T> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const cacheKey = `${this.apiUrl}:${id}`;
    const ttl = cacheTtl || this.DEFAULT_CACHE_TTL;

    // Si caching está habilitado, usar CacheManager
    if (useCache) {
      return this.cache.get(
        cacheKey,
        () => this.fetchById(id),
        ttl
      ).pipe(
        tap((data) => this.selectedSubject.next(data)),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
    }

    // Sin cache, fetch directo
    return this.fetchById(id);
  }

  /**
   * Fetch interno para getById (sin cache)
   */
  private fetchById(id: number): Observable<T> {
    return this.http
      .get<T>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retryWhen((errors) =>
          errors.pipe(
            mergeMap((error, index) => {
              // No reintentar errores de conexión (status 0) o errores de cliente (4xx)
              if (error.status === 0 || (error.status >= 400 && error.status < 500)) {
                return throwError(() => error);
              }
              // Reintentar hasta 2 veces para errores del servidor (5xx) o timeout
              if (index < 2) {
                return timer(this.DEFAULT_RETRY_DELAY * (index + 1));
              }
              return throwError(() => error);
            })
          )
        ),
        tap((data) => {
          this.selectedSubject.next(data);
        }),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Crear nuevo registro
   * Invalida automáticamente el caché de listados
   */
  create(data: Partial<T>): Observable<T> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .post<T>(this.apiUrl, data)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        tap((newItem) => {
          // Actualizar estado local
          const current = this.dataSubject.getValue();
          this.dataSubject.next([...current, newItem]);
          
          // Invalidar caché relacionado
          this.cache.invalidatePattern(`^${this.apiUrl.replace(/\//g, '\\/')}:`);
        }),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Actualizar registro existente
   * Invalida automáticamente el caché del registro y listados
   */
  update(id: number, data: Partial<T>): Observable<T> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .patch<T>(`${this.apiUrl}/${id}`, data)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        tap((updated) => {
          // Actualizar estado local
          const current = this.dataSubject.getValue();
          const index = current.findIndex((item) => item.id === id);
          if (index !== -1) {
            current[index] = updated;
            this.dataSubject.next([...current]);
          }
          if (this.selectedSubject.getValue()?.id === id) {
            this.selectedSubject.next(updated);
          }
          
          // Invalidar caché relacionado
          this.cache.invalidatePattern(`^${this.apiUrl.replace(/\//g, '\\/')}:`);
        }),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Eliminar registro
   * Invalida automáticamente el caché del registro y listados
   */
  delete(id: number): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        tap(() => {
          // Actualizar estado local
          const current = this.dataSubject.getValue();
          this.dataSubject.next(current.filter((item) => item.id !== id));
          if (this.selectedSubject.getValue()?.id === id) {
            this.selectedSubject.next(null);
          }
          
          // Invalidar caché relacionado
          this.cache.invalidatePattern(`^${this.apiUrl.replace(/\//g, '\\/')}:`);
        }),
        catchError((err) => {
          const errorMsg = this.handleError(err);
          this.errorSubject.next(errorMsg);
          return throwError(() => err);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Seleccionar un registro
   */
  select(item: T): void {
    this.selectedSubject.next(item);
  }

  /**
   * Limpiar selección
   */
  clearSelection(): void {
    this.selectedSubject.next(null);
  }

  /**
   * Limpiar errores
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Manejo de errores estandarizado
   */
  protected handleError(error: any): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Connection error. Check your internet connection.';
      }
      if (error.status === 400) {
        return error.error?.message || 'Invalid request.';
      }
      if (error.status === 401) {
        return 'Session expired. Please sign in again.';
      }
      if (error.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      if (error.status === 404) {
        return 'The requested resource was not found.';
      }
      if (error.status === 409) {
        return error.error?.message || 'The resource already exists or there is a conflict.';
      }
      if (error.status === 500) {
        return 'Server error. Please try again later.';
      }
      return error.error?.message || `Error HTTP ${error.status}`;
    }

    if (error.name === 'TimeoutError') {
      return 'The request timed out. Please try again.';
    }

    return error.message || 'An unknown error occurred.';
  }

  /**
   * Obtener el estado de carga actual
   */
  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  /**
   * Obtener el error actual
   */
  getError(): string | null {
    return this.errorSubject.getValue();
  }

  /**
   * Obtener los datos actuales
   */
  getData(): T[] {
    return this.dataSubject.getValue();
  }

  /**
   * Limpiar todos los estados y caché
   */
  reset(): void {
    this.dataSubject.next([]);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
    this.selectedSubject.next(null);
    
    // Limpiar caché relacionado con este servicio
    this.cache.invalidate(`${this.apiUrl}:*`);
  }
  
  /**
   * Invalidar caché manualmente
   * @param pattern - Patrón para invalidar (default: all relacionado con apiUrl)
   */
  invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern || `${this.apiUrl}:*`);
  }
  
  /**
   * Obtener estadísticas del caché
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}
