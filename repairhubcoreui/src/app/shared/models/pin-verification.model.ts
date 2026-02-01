/**
 * PIN Verification Models
 * 
 * Define las interfaces para el flujo de verificación de PIN
 * después del login inicial de empleados.
 */

/**
 * Request para verificar PIN
 */
export interface VerifyPinRequest {
  /**
   * PIN ingresado por el empleado (4-6 dígitos)
   */
  pin: string;
}

/**
 * Response de verificación de PIN
 */
export interface VerifyPinResponse {
  /**
   * Indica si el PIN fue correcto
   */
  verified: boolean;

  /**
   * Token JWT actualizado después de verificación
   */
  access_token: string;

  /**
   * Token de refresco
   */
  refresh_token?: string;

  /**
   * Información del empleado
   */
  user?: any;

  /**
   * Tipo de usuario (siempre 'employee' en este caso)
   */
  userType?: 'employee';

  /**
   * Mensaje de error si la verificación falló
   */
  message?: string;

  /**
   * Código de error si la verificación falló
   */
  error?: string;
}

/**
 * Estado de verificación PIN en el servicio de autenticación
 */
export interface PinVerificationState {
  /**
   * Si la verificación está en progreso
   */
  isVerifying: boolean;

  /**
   * Si hubo un error en la verificación
   */
  error: string | null;

  /**
   * Cantidad de intentos fallidos
   */
  attempts: number;

  /**
   * Máximo de intentos permitidos
   */
  maxAttempts: number;

  /**
   * Si el formulario está bloqueado después de máximo intentos
   */
  isLocked: boolean;
}
