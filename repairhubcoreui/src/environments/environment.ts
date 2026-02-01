/**
 * Environment Configuration - Development
 * 
 * @description
 * Configuración específica para el entorno de desarrollo.
 * Este archivo contiene URLs, timeouts, TTLs y feature flags.
 * 
 * @example
 * import { environment } from './environments/environment';
 * const apiUrl = environment.apiUrl;
 */

export const environment = {
  /**
   * Indica si la aplicación está en modo producción
   */
  production: false,

  /**
   * URL base del API backend
   */
  apiUrl: 'http://localhost:3000',

  /**
   * Versión del API
   */
  apiVersion: 'v1',

  /**
   * Configuración de timeouts HTTP (en milisegundos)
   */
  http: {
    /**
     * Timeout default para peticiones HTTP normales
     */
    timeout: 30000, // 30 segundos

    /**
     * Timeout para operaciones de upload
     */
    uploadTimeout: 120000, // 2 minutos

    /**
     * Timeout para operaciones de download/export
     */
    downloadTimeout: 60000, // 1 minuto

    /**
     * Número de reintentos en caso de error
     */
    retryAttempts: 3,

    /**
     * Delay entre reintentos (en milisegundos)
     */
    retryDelay: 1000, // 1 segundo
  },

  /**
   * Configuración del sistema de caché
   */
  cache: {
    /**
     * TTL por defecto para caché (en milisegundos)
     */
    defaultTtl: 180000, // 3 minutos

    /**
     * TTLs específicos por tipo de recurso
     */
    ttl: {
      users: 300000, // 5 minutos
      orders: 600000, // 10 minutos
      customers: 300000, // 5 minutos
      employees: 300000, // 5 minutos
      devices: 600000, // 10 minutos
      items: 600000, // 10 minutos
      appointments: 180000, // 3 minutos
      notifications: 60000, // 1 minuto
      reports: 300000, // 5 minutos
    },

    /**
     * Habilitar/deshabilitar caché globalmente
     */
    enabled: true,

    /**
     * Modo debug para caché (logs en consola)
     */
    debug: true,
  },

  /**
   * Feature flags para habilitar/deshabilitar funcionalidades
   */
  features: {
    /**
     * Modo offline - permite trabajar sin conexión
     */
    offlineMode: true,

    /**
     * Sistema de caché inteligente
     */
    caching: true,

    /**
     * Actualizaciones optimistas (UI se actualiza antes de confirmar con servidor)
     */
    optimisticUpdates: false,

    /**
     * Analytics y tracking de uso
     */
    analytics: false,

    /**
     * Logs detallados en consola
     */
    verboseLogs: true,

    /**
     * Mock API interceptor para desarrollo sin backend
     * DESACTIVADO - usando API real en http://localhost:3000
     */
    mockApi: false,

    /**
     * Notificaciones push
     */
    pushNotifications: false,
  },

  /**
   * Configuración de autenticación
   */
  auth: {
    /**
     * Tiempo de expiración del token JWT (en milisegundos)
     */
    tokenExpiration: 3600000, // 1 hora

    /**
     * Tiempo de expiración del refresh token (en milisegundos)
     */
    refreshTokenExpiration: 86400000, // 24 horas

    /**
     * Auto-refresh del token (renovar automáticamente antes de expirar)
     */
    autoRefresh: true,

    /**
     * Tiempo antes de expiración para renovar token (en milisegundos)
     */
    refreshBeforeExpiration: 300000, // 5 minutos
  },

  /**
   * Configuración de paginación
   */
  pagination: {
    /**
     * Tamaño de página por defecto
     */
    defaultPageSize: 10,

    /**
     * Opciones de tamaño de página
     */
    pageSizeOptions: [5, 10, 25, 50, 100],
  },

  /**
   * Configuración de notificaciones
   */
  notifications: {
    /**
     * Duración por defecto de notificaciones (en milisegundos)
     */
    defaultDuration: 3000, // 3 segundos

    /**
     * Duración para notificaciones de error
     */
    errorDuration: 5000, // 5 segundos

    /**
     * Duración para notificaciones de éxito
     */
    successDuration: 2000, // 2 segundos

    /**
     * Máximo de notificaciones simultáneas
     */
    maxNotifications: 5,
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
