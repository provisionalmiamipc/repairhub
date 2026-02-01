/**
 * AppState Interface
 * Define la estructura global de estado de la aplicación
 *
 * @example
 * {
 *   user: { id: 1, email: 'user@example.com', ... },
 *   ui: { sidebarCollapsed: false, theme: 'dark' },
 *   cache: { users: [...], orders: [...] },
 *   filters: { customers: { search: 'John' } }
 * }
 */
export interface UserSession {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  lastActivity: Date;
  expiresAt: Date;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  currentModule: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  duration?: number;
}

export interface CacheState {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number; // milliseconds
  };
}

export interface FilterState {
  [moduleName: string]: {
    [filterKey: string]: any;
  };
}

/**
 * AppState - Estructura principal de estado global
 * Acceso singleton desde cualquier parte de la app
 */
export interface AppState {
  user: UserSession | null;
  ui: UIState;
  cache: CacheState;
  filters: FilterState;
  offline: boolean;
  lastSyncTime: Date | null;
}

/**
 * AppStateUpdate - Partial updates para estado
 */
export type AppStateUpdate = Partial<AppState>;

/**
 * Cache metadata para invalidación inteligente
 */
export interface CacheMetadata {
  key: string;
  ttl: number;
  dependencies?: string[]; // Invalidar cuando estas keys cambian
  timestamp: number;
}
