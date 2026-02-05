/**
 * Environment Configuration - Development
 * 
 * @description
 * Configuración específica para el entorno de desarrollo local.
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
   * URL base del API backend (Desarrollo local)
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
    retries: 3,

    /**
     * Delay entre reintentos (ms)
     */
    retryDelay: 1000,
  },

  /**
   * Configuración de caché HTTP
   */
  cache: {
    /**
     * Habilitar/deshabilitar caché
     */
    enabled: true,

    /**
     * Modo debug para cache
     */
    debug: true,

    /**
     * TTL default del caché (milisegundos)
     */
    defaultTTL: 300000, // 5 minutos

    /**
     * TTL para datos que cambian frecuentemente
     */
    shortTTL: 60000, // 1 minuto

    /**
     * TTL para datos que cambian poco
     */
    longTTL: 900000, // 15 minutos

    /**
     * TTL para catálogos estáticos
     */
    catalogTTL: 3600000, // 1 hora
  },

  /**
   * Configuración de la aplicación
   */
  app: {
    name: 'RepairHub',
    version: '1.0.0-dev',
    supportEmail: 'support@repairhub.com',
  },

  /**
   * Feature flags
   */
  features: {
    analytics: false,
    errorTracking: false,
    logging: true,
    debug: true,
  },

  /**
   * Configuración de seguridad
   */
  security: {
    enableCSP: false,
    enforceHTTPS: false,
  },

  /**
   * Configuración de almacenamiento local
   */
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userDataKey: 'user_data',
    prefix: 'rh_dev_',
  },

  /**
   * Configuración de paginación
   */
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxPageSize: 100,
  },

  /**
   * Configuración de notificaciones
   */
  notifications: {
    duration: 5000,
    maxNotifications: 3,
    position: 'top-right' as const,
  },

  /**
   * Configuración de formato de fechas
   */
  dateFormat: {
    display: 'dd/MM/yyyy',
    api: 'yyyy-MM-dd',
    displayTime: 'dd/MM/yyyy HH:mm',
    apiTime: "yyyy-MM-dd'T'HH:mm:ss",
  },

  /**
   * Configuración de idioma
   */
  locale: {
    default: 'es',
    available: ['es', 'en'],
    currency: 'USD',
    timezone: 'America/Mexico_City',
  },

  /**
   * URLs de recursos externos
   */
  external: {
    documentationUrl: 'http://localhost:4200/docs',
    supportUrl: 'http://localhost:4200/support',
    termsUrl: 'http://localhost:4200/terms',
    privacyUrl: 'http://localhost:4200/privacy',
  },

  /**
   * Configuración de validación
   */
  validation: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    phonePattern: /^[0-9+\-\s()]{10,15}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  /**
   * Configuración de archivos
   */
  files: {
    maxUploadSize: 10485760, // 10 MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  },

  /**
   * Configuración de mock API
   */
  mock: {
    enabled: false,
    delay: 500,
  },
};
