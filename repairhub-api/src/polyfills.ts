import * as nodeCrypto from 'crypto';

// Asegurar crypto global para dependencias que lo usan directamente
(global as any).crypto = nodeCrypto;
