import * as nodeCrypto from 'crypto';

// Asegurar crypto global para dependencias que lo usan directamente
// En Node.js 22+, crypto ya está disponible globalmente
if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto;
}
