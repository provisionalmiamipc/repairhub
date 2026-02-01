/**
 * AppStateService
 * 
 * @description
 * Servicio global para gestionar el estado de la aplicación.
 * Persiste automáticamente el estado en sessionStorage.
 * 
 * @example
 * constructor(private appState: AppStateService) {
 *   this.appState.currentUser$.subscribe(user => {
 *     console.log('Usuario actual:', user);
 *   });
 * }
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SessionStorageService } from './session-storage.service';

export interface AppState {
  currentUser: any | null;
  currentCenter: any | null;
  currentStore: any | null;
  lastAccessedModule: string | null;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  sidebarVisible: boolean;
  language: string;
  timestamp: number;
  // Compatibilidad con AppState anterior
  user?: any | null;
  ui?: {
    notifications?: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      timestamp: Date;
      duration?: number;
    }>;
  };
}

const INITIAL_STATE: AppState = {
  currentUser: null,
  currentCenter: null,
  currentStore: null,
  lastAccessedModule: null,
  theme: 'light',
  sidebarCollapsed: false,
  sidebarVisible: true,
  language: 'es',
  timestamp: Date.now(),
  // Compatibilidad
  user: null,
  ui: {
    notifications: []
  }
};

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private readonly STORAGE_KEY = 'repairhub_app_state';
  private readonly state$ = new BehaviorSubject<AppState>(this.loadState());

  // Observables públicos
  currentUser$: Observable<any | null> = this.state$.pipe(map(s => s.currentUser));
  currentCenter$: Observable<any | null> = this.state$.pipe(map(s => s.currentCenter));
  currentStore$: Observable<any | null> = this.state$.pipe(map(s => s.currentStore));
  lastAccessedModule$: Observable<string | null> = this.state$.pipe(map(s => s.lastAccessedModule));
  theme$: Observable<'light' | 'dark'> = this.state$.pipe(map(s => s.theme));
  sidebarCollapsed$: Observable<boolean> = this.state$.pipe(map(s => s.sidebarCollapsed));
  sidebarVisible$: Observable<boolean> = this.state$.pipe(map(s => s.sidebarVisible));
  language$: Observable<string> = this.state$.pipe(map(s => s.language));

  constructor(private storage: SessionStorageService) {
    // Auto-persistir estado cuando cambia
    this.state$.subscribe(state => {
      this.persistState(state);
    });

    console.log('[AppState] Inicializado con estado:', this.state$.value);
  }

  /**
   * Obtiene el estado completo actual
   */
  getState(): AppState {
    return this.state$.value;
  }

  /**
   * Compatibilidad: acceso síncrono al estado (snapshot)
   */
  get snapshot(): AppState {
    return this.state$.value;
  }

  /**
   * Compatibilidad: agregar notificación al estado
   */
  addNotification(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    duration: number = 3000
  ): void {
    const notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date(),
      duration
    };

    const current = this.state$.value;
    const notifications = current.ui?.notifications || [];
    
    this.updateState({
      ui: {
        notifications: [...notifications, notification]
      }
    });

    console.log(`[AppState] Notificación ${type}: ${message}`);
    
    // Auto-remove después de duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  /**
   * Elimina una notificación por ID
   */
  removeNotification(id: string): void {
    const current = this.state$.value;
    const notifications = current.ui?.notifications || [];
    
    this.updateState({
      ui: {
        notifications: notifications.filter(n => n.id !== id)
      }
    });
  }

  /**
   * Establece el usuario actual
   */
  setCurrentUser(user: any | null): void {
    console.log('[AppState] Estableciendo usuario:', user?.name || 'null');
    this.updateState({ 
      currentUser: user,
      user: user // Compatibilidad con AppState anterior
    });
  }

  /**
   * Obtiene el usuario actual (síncrono)
   */
  getCurrentUser(): any | null {
    return this.state$.value.currentUser;
  }

  /**
   * Establece el centro actual
   */
  setCurrentCenter(center: any | null): void {
    console.log('[AppState] Estableciendo centro:', center?.name || 'null');
    this.updateState({ currentCenter: center });
  }

  /**
   * Obtiene el centro actual (síncrono)
   */
  getCurrentCenter(): any | null {
    return this.state$.value.currentCenter;
  }

  /**
   * Establece la tienda actual
   */
  setCurrentStore(store: any | null): void {
    console.log('[AppState] Estableciendo tienda:', store?.name || 'null');
    this.updateState({ currentStore: store });
  }

  /**
   * Obtiene la tienda actual (síncrono)
   */
  getCurrentStore(): any | null {
    return this.state$.value.currentStore;
  }

  /**
   * Establece el último módulo accedido
   */
  setLastAccessedModule(module: string | null): void {
    console.log('[AppState] Módulo accedido:', module);
    this.updateState({ lastAccessedModule: module });
  }

  /**
   * Establece el tema
   */
  setTheme(theme: 'light' | 'dark'): void {
    console.log('[AppState] Cambiando tema a:', theme);
    this.updateState({ theme });
  }

  /**
   * Alterna el tema entre light y dark
   */
  toggleTheme(): void {
    const currentTheme = this.state$.value.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Colapsa/expande el sidebar
   */
  setSidebarCollapsed(collapsed: boolean): void {
    console.log('[AppState] Sidebar collapsed:', collapsed);
    this.updateState({ sidebarCollapsed: collapsed });
  }

  /**
   * Alterna el estado colapsado del sidebar
   */
  toggleSidebar(): void {
    const current = this.state$.value.sidebarCollapsed;
    this.setSidebarCollapsed(!current);
  }

  /**
   * Muestra/oculta el sidebar
   */
  setSidebarVisible(visible: boolean): void {
    console.log('[AppState] Sidebar visible:', visible);
    this.updateState({ sidebarVisible: visible });
  }

  /**
   * Establece el idioma
   */
  setLanguage(language: string): void {
    console.log('[AppState] Idioma:', language);
    this.updateState({ language });
  }

  /**
   * Limpia todo el estado (útil en logout)
   */
  clear(): void {
    console.log('[AppState] Limpiando estado');
    this.state$.next({ ...INITIAL_STATE, timestamp: Date.now() });
    this.storage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Compatibilidad: alias para clear()
   */
  clearUserSession(): void {
    this.clear();
  }

  /**
   * Reinicia el estado a valores por defecto pero manteniendo tema y configuración UI
   */
  resetUser(): void {
    console.log('[AppState] Reiniciando usuario');
    const current = this.state$.value;
    this.updateState({
      currentUser: null,
      currentCenter: null,
      currentStore: null,
      lastAccessedModule: null
      // Mantiene theme, sidebar, language
    });
  }

  /**
   * Actualiza el estado parcialmente
   */
  private updateState(partial: Partial<AppState>): void {
    const current = this.state$.value;
    this.state$.next({
      ...current,
      ...partial,
      timestamp: Date.now()
    });
  }

  /**
   * Carga el estado desde sessionStorage
   */
  private loadState(): AppState {
    const persisted = this.storage.getItem(this.STORAGE_KEY);
    
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        console.log('[AppState] Estado cargado desde storage');
        return { ...INITIAL_STATE, ...parsed };
      } catch (e) {
        console.error('[AppState] Error al parsear estado guardado:', e);
        return INITIAL_STATE;
      }
    }
    
    console.log('[AppState] Usando estado inicial');
    return INITIAL_STATE;
  }

  /**
   * Persiste el estado en sessionStorage
   */
  private persistState(state: AppState): void {
    try {
      const serialized = JSON.stringify(state);
      this.storage.setItem(this.STORAGE_KEY, serialized);
    } catch (e) {
      console.error('[AppState] Error al persistir estado:', e);
    }
  }
}
