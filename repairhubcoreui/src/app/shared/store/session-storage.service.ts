/**
 * SessionStorageService
 * 
 * @description
 * Servicio wrapper para sessionStorage con manejo de errores robusto.
 * Proporciona métodos seguros para almacenar y recuperar datos.
 * 
 * @example
 * constructor(private storage: SessionStorageService) {
 *   this.storage.setItem('key', 'value');
 *   const value = this.storage.getItem('key');
 * }
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  /**
   * Guarda un item en sessionStorage
   */
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (e: any) {
      console.error(`[SessionStorage] Error al guardar "${key}":`, e.message);
      // Si es quota exceeded, intentar limpiar datos antiguos
      if (e.name === 'QuotaExceededError') {
        console.warn('[SessionStorage] Cuota excedida. Limpiando datos antiguos...');
        this.clearOldData();
        // Reintentar
        try {
          sessionStorage.setItem(key, value);
        } catch (retryError: any) {
          console.error(`[SessionStorage] Fallo al reintentar guardar "${key}":`, retryError.message);
        }
      }
    }
  }

  /**
   * Recupera un item de sessionStorage
   */
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (e: any) {
      console.error(`[SessionStorage] Error al leer "${key}":`, e.message);
      return null;
    }
  }

  /**
   * Elimina un item de sessionStorage
   */
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (e: any) {
      console.error(`[SessionStorage] Error al eliminar "${key}":`, e.message);
    }
  }

  /**
   * Limpia todo el sessionStorage
   */
  clear(): void {
    try {
      sessionStorage.clear();
    } catch (e: any) {
      console.error('[SessionStorage] Error al limpiar:', e.message);
    }
  }

  /**
   * Verifica si una key existe
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Obtiene todas las keys almacenadas
   */
  getAllKeys(): string[] {
    try {
      return Object.keys(sessionStorage);
    } catch (e: any) {
      console.error('[SessionStorage] Error al obtener keys:', e.message);
      return [];
    }
  }

  /**
   * Limpia datos con más de X días de antigüedad
   * (Solo funciona si los datos tienen timestamp)
   */
  private clearOldData(): void {
    const MAX_AGE_DAYS = 7;
    const now = Date.now();
    const keys = this.getAllKeys();

    keys.forEach(key => {
      try {
        const item = this.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.timestamp) {
            const age = now - parsed.timestamp;
            const ageDays = age / (1000 * 60 * 60 * 24);
            if (ageDays > MAX_AGE_DAYS) {
              this.removeItem(key);
              console.log(`[SessionStorage] Eliminado item antiguo: ${key}`);
            }
          }
        }
      } catch (e) {
        // Si no es JSON válido, ignorar
      }
    });
  }
}
