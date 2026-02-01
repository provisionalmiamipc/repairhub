// src/environments/environment.prod.ts (Producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com', // ← Cambiar a tu API real
  apiVersion: 'v1',
  appName: 'RepairHub',
  appVersion: '1.0.0',
  
  // Timeouts
  requestTimeout: 30000, // 30 segundos
  
  // Features
  features: {
    mockApi: false,         // NUNCA habilitar MockApi en producción
    analytics: true,        // Habilitar Google Analytics
    errorTracking: true,    // Habilitar Sentry/error tracking
    logging: true,
    debug: false            // NO mostrar logs en consola
  },
  
  // Security
  security: {
    enableCSP: true,        // Content Security Policy
    enforceHTTPS: true      // Forzar HTTPS
  },
  
  // Storage
  storage: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    userDataKey: 'user_data'
  },
  
  // API Retry
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2
  },
  
  // Logging
  logging: {
    level: 'error',         // Solo errores
    enableConsole: false    // No loguear en consola
  }
};