/**
 * Environment Configuration - Production
 * 
 * @description
 * Configuración específica para el entorno de producción.
 * Valores optimizados para performance y seguridad.
 * 
 * @example
 * import { environment } from './environments/environment';
 * const apiUrl = environment.apiUrl;
 */

export const environment = {
  /**
   * Indica si la aplicación está en modo producción
   */
  production: true,

  /**
   * URL base del API backend (Railway)
   */
  apiUrl: 'https://empowering-elegance-production-38dc.up.railway.app/api',

  /**
   * Versión del API
   */
  apiVersion: 'v1',

  /**
   * Configuración de timeouts HTTP (en milisegundos)
   */
  http: {
    timeout: 30000, // 30 segundos
    uploadTimeout: 120000, // 2 minutos
    downloadTimeout: 60000, // 1 minuto
    retryAttempts: 3,
    retryDelay: 1000,
  },

  /**
   * Configuración del sistema de caché
   */
  cache: {
    defaultTtl: 300000, // 5 minutos (más largo en prod)

    ttl: {
      users: 600000, // 10 minutos
      orders: 300000, // 5 minutos (menos para datos críticos)
      customers: 600000, // 10 minutos
      employees: 600000, // 10 minutos
      devices: 1200000, // 20 minutos
      items: 1200000, // 20 minutos
      appointments: 180000, // 3 minutos
      notifications: 60000, // 1 minuto
      reports: 600000, // 10 minutos
    },

    enabled: true,
    debug: false, // Sin logs en producción
  },

  /**
   * Feature flags para producción
   */
  features: {
    offlineMode: true,
    caching: true,
    optimisticUpdates: true, // Habilitado en prod para mejor UX
    analytics: true, // Habilitado en prod
    verboseLogs: false, // Deshabilitado en prod
    mockApi: false, // Siempre false en prod
    pushNotifications: true, // Habilitado en prod
  },

  /**
   * Configuración de autenticación
   */
  auth: {
    tokenExpiration: 3600000, // 1 hora
    refreshTokenExpiration: 86400000, // 24 horas
    autoRefresh: true,
    refreshBeforeExpiration: 300000, // 5 minutos
  },

  /**
   * Configuración de paginación
   */
  pagination: {
    defaultPageSize: 25, // Más items en prod
    pageSizeOptions: [10, 25, 50, 100],
  },

  /**
   * Configuración de notificaciones
   */
  notifications: {
    defaultDuration: 3000,
    errorDuration: 5000,
    successDuration: 2000,
    maxNotifications: 3, // Menos notificaciones en prod
  },

  /**
   * URLs de endpoints específicos
   */
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    users: '/users',
    orders: '/orders',
    customers: '/customers',
    employees: '/employees',
    devices: '/devices',
    items: '/items',
    appointments: '/appointments',
    notifications: '/notifications',
  },
};
