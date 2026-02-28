/**
 * Environment Configuration - Production
 * 
 * @description
 * Configuración específica para el entorno de producción.
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
  production: true,

  /**
   * URL base del API backend (Railway - Producción)
   */
  apiUrl: 'https://empowering-elegance-production-38dc.up.railway.app',

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
    debug: false,

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
    name: 'OceanSPT',
    version: '1.0.0',
    supportEmail: 'support@repairhub.com',
  },

  /**
   * Feature flags
   */
  features: {
    analytics: true,
    errorTracking: true,
    logging: false,
    debug: false,
  },

  /**
   * Logging configuration (kept for parity with development environment)
   */
  logging: {
    level: 'info',
    enableConsole: false,
  },

  /**
   * Configuración de seguridad
   */
  security: {
    enableCSP: true,
    enforceHTTPS: true,
  },

  /**
   * Configuración de almacenamiento local
   */
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userDataKey: 'user_data',
    prefix: 'rh_',
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
    documentationUrl: 'https://docs.repairhub.com',
    supportUrl: 'https://support.repairhub.com',
    termsUrl: 'https://repairhub.com/terms',
    privacyUrl: 'https://repairhub.com/privacy',
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
    delay: 0,
  },
};
