/**
 * CacheManagerService
 * 
 * @description
 * Servicio para gestionar caché inteligente con TTL (Time To Live).
 * Reduce requests HTTP duplicados y mejora performance.
 * 
 * @example
 * constructor(private cache: CacheManagerService) {}
 * 
 * getData() {
 *   return this.cache.get(
 *     'users:all',
 *     () => this.http.get('/api/users'),
 *     5 * 60 * 1000 // 5 minutos TTL
 *   );
 * }
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  size: number;
  keys: string[];
  hits: number;
  misses: number;
  hitRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheManagerService {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private readonly enabled: boolean;
  private readonly debug: boolean;
  private readonly defaultTTL: number;

  constructor() {
    this.enabled = environment.cache?.enabled ?? true;
    this.debug = environment.cache?.debug ?? false;
    this.defaultTTL = environment.cache?.defaultTTL ?? 5 * 60 * 1000; // 5 minutos por defecto

    if (this.debug) {
      console.log('[CacheManager] Inicializado', {
        enabled: this.enabled,
        defaultTTL: this.defaultTTL,
        debug: this.debug
      });
    }

    // Limpieza periódica cada 5 minutos
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  /**
   * Obtiene datos del caché o ejecuta el fetcher si no existe o está expirado
   * 
   * @param key - Clave única para identificar los datos
   * @param fetcher - Función que retorna un Observable con los datos
   * @param ttl - Tiempo de vida en milisegundos (opcional)
   */
  get<T>(
    key: string,
    fetcher: () => Observable<T>,
    ttl: number = this.defaultTTL
  ): Observable<T> {
    if (!this.enabled) {
      return fetcher();
    }

    const cached = this.cache.get(key);

    // Cache HIT - datos válidos
    if (cached && !this.isExpired(cached)) {
      this.hits++;
      if (this.debug) {
        const age = Date.now() - cached.timestamp;
        console.log(`[Cache HIT] "${key}" (age: ${Math.round(age / 1000)}s)`);
      }
      return of(cached.data as T);
    }

    // Cache MISS - obtener datos nuevos
    this.misses++;
    if (this.debug) {
      const reason = cached ? 'expired' : 'not-found';
      console.log(`[Cache MISS] "${key}" (reason: ${reason})`);
    }

    return fetcher().pipe(
      tap(data => {
        this.set(key, data, ttl);
      })
    );
  }

  /**
   * Guarda datos en el caché manualmente
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    if (!this.enabled) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    if (this.debug) {
      console.log(`[Cache SET] "${key}" (ttl: ${Math.round(ttl / 1000)}s)`);
    }
  }

  /**
   * Verifica si existe una key en el caché y no está expirada
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && !this.isExpired(cached);
  }

  /**
   * Invalida (elimina) una entrada específica del caché
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (this.debug && deleted) {
      console.log(`[Cache INVALIDATE] "${key}"`);
    }
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón regex
   * 
   * @example
   * // Invalida todas las keys que empiecen con "users:"
   * cacheManager.invalidatePattern('^users:');
   * 
   * // Invalida todas las keys que contengan "customer"
   * cacheManager.invalidatePattern('customer');
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;

    Array.from(this.cache.keys())
      .filter(key => regex.test(key))
      .forEach(key => {
        this.cache.delete(key);
        count++;
      });

    if (this.debug && count > 0) {
      console.log(`[Cache INVALIDATE PATTERN] "${pattern}" (${count} entries)`);
    }
  }

  /**
   * Invalida todas las entradas relacionadas con una entidad
   * 
   * @example
   * // Invalida: users:all, users:1, users:search, etc.
   * cacheManager.invalidateEntity('users');
   */
  invalidateEntity(entity: string): void {
    this.invalidatePattern(`^${entity}:`);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;

    if (this.debug) {
      console.log(`[Cache CLEAR] ${size} entries removed`);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0
    };
  }

  /**
   * Imprime estadísticas en consola
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('[Cache Stats]', {
      entries: stats.size,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${stats.hitRate.toFixed(1)}%`
    });
  }

  /**
   * Obtiene el tamaño aproximado del caché en bytes
   */
  getSize(): number {
    let size = 0;
    this.cache.forEach((entry) => {
      try {
        size += JSON.stringify(entry.data).length;
      } catch (e) {
        // Si no se puede serializar, ignorar
      }
    });
    return size;
  }

  /**
   * Verifica si una entrada está expirada
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Limpia entradas expiradas del caché
   */
  private cleanupExpired(): void {
    let count = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        count++;
      }
    });

    if (this.debug && count > 0) {
      console.log(`[Cache CLEANUP] ${count} expired entries removed`);
    }
  }

  /**
   * Genera una key de caché estándar
   * 
   * @example
   * const key = cacheManager.generateKey('users', 'list', { page: 1 });
   * // Retorna: "users:list:page=1"
   */
  generateKey(entity: string, operation: string, params?: Record<string, any>): string {
    let key = `${entity}:${operation}`;
    
    if (params) {
      const paramStr = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      
      if (paramStr) {
        key += `:${paramStr}`;
      }
    }
    
    return key;
  }
}
