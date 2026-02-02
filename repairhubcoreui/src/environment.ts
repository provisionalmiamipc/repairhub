// src/environments/environment.ts (Desarrollo)
export const environment = {
  production: false,
  apiUrl: 'https://empowering-elegance-production-38dc.up.railway.app/api',
  apiVersion: 'v1',
  appName: 'RepairHub',
  appVersion: '1.0.0',
  
  // Timeouts
  requestTimeout: 30000, // 30 segundos
  
  // Features
  features: {
    analytics: false,
    errorTracking: false,
    logging: true,
    debug: true
  },
  
  // Security
  security: {
    enableCSP: false,
    enforceHTTPS: false
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
    level: 'debug', // debug | info | warn | error
    enableConsole: true
  },
  
  // Cache/Mock API
  cache: {
    debug: true
  }
};