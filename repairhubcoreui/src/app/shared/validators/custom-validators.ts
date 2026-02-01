import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Validadores personalizados reutilizables para formularios
 */

// ============ VALIDADORES SÍNCRONOS ============

/**
 * Validar que una contraseña sea fuerte
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial
 */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // No validar si está vacío
    }

    const password = control.value;
    const errors: ValidationErrors = {};

    if (password.length < 8) {
      errors['minLength'] = { requiredLength: 8, actualLength: password.length };
    }

    if (!/[A-Z]/.test(password)) {
      errors['uppercase'] = true;
    }

    if (!/[a-z]/.test(password)) {
      errors['lowercase'] = true;
    }

    if (!/[0-9]/.test(password)) {
      errors['number'] = true;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors['specialChar'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Validar formato de email
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const email = control.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email) ? null : { invalidEmail: true };
  };
}

/**
 * Validar formato de teléfono
 * Soporta: +1234567890, (123) 456-7890, 123-456-7890
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const phone = control.value.replace(/\D/g, '');

    if (phone.length < 10) {
      return { invalidPhone: { length: phone.length } };
    }

    return null;
  };
}

/**
 * Validar que dos campos coincidan (ej: password y confirmPassword)
 */
export function matchValidator(fieldName: string, matchingFieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const field = control.get(fieldName);
    const matchingField = control.get(matchingFieldName);

    if (!field || !matchingField) {
      return null;
    }

    if (field.value !== matchingField.value) {
      matchingField.setErrors({ notMatching: true });
      return { notMatching: true };
    }

    // Limpiar el error si ahora coinciden
    if (matchingField.errors) {
      delete matchingField.errors['notMatching'];
      if (Object.keys(matchingField.errors).length === 0) {
        matchingField.setErrors(null);
      }
    }

    return null;
  };
}

/**
 * Validar que el campo sea una URL válida
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  };
}

/**
 * Validar que sea un número dentro de un rango
 */
export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }

    const value = Number(control.value);

    if (isNaN(value)) {
      return { invalidNumber: true };
    }

    if (value < min || value > max) {
      return { outOfRange: { min, max, actual: value } };
    }

    return null;
  };
}

/**
 * Validar que no sea solo espacios en blanco
 */
export function notEmptyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const trimmed = String(control.value).trim();

    return trimmed.length === 0 ? { onlyWhitespace: true } : null;
  };
}

/**
 * Validar longitud mínima de caracteres (trimmed)
 */
export function minLengthTrimmedValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const trimmed = String(control.value).trim();

    if (trimmed.length < minLength) {
      return { minLengthTrimmed: { requiredLength: minLength, actualLength: trimmed.length } };
    }

    return null;
  };
}

// ============ VALIDADORES ASÍNCRONOS ============

/**
 * Validador asíncrono para verificar disponibilidad de email (llamar a backend)
 * Nota: Debounce automático para no hacer request en cada keystroke
 */
export function emailAvailabilityValidator(checkEmailAvailabilityFn: (email: string) => Observable<boolean>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    // Debounce: esperar 500ms después del último cambio
    return timer(500).pipe(
      switchMap(() => {
        return checkEmailAvailabilityFn(control.value).pipe(
          map(isAvailable => isAvailable ? null : { emailTaken: true }),
          catchError(() => of(null)) // Si el endpoint falla, permitir el envío
        );
      })
    );
  };
}

/**
 * Validador asíncrono para verificar disponibilidad de username
 */
export function usernameAvailabilityValidator(checkUsernameFn: (username: string) => Observable<boolean>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.length < 3) {
      return of(null);
    }

    return timer(500).pipe(
      switchMap(() => {
        return checkUsernameFn(control.value).pipe(
          map(isAvailable => isAvailable ? null : { usernameTaken: true }),
          catchError(() => of(null))
        );
      })
    );
  };
}

// ============ MENSAJES DE ERROR ============

export const VALIDATION_MESSAGES = {
  required: 'Este campo es requerido',
  minLength: (minLength: number) => `Mínimo ${minLength} caracteres`,
  maxLength: (maxLength: number) => `Máximo ${maxLength} caracteres`,
  pattern: 'Formato inválido',
  email: 'Email inválido',
  invalidEmail: 'Email inválido',
  invalidPhone: 'Teléfono inválido',
  invalidUrl: 'URL inválida',
  invalidNumber: 'Debe ser un número',
  outOfRange: (min: number, max: number) => `Debe estar entre ${min} y ${max}`,
  onlyWhitespace: 'No puede contener solo espacios',
  minLengthTrimmed: (minLength: number) => `Mínimo ${minLength} caracteres (sin espacios)`,
  notMatching: 'Los campos no coinciden',
  uppercase: 'Debe contener al menos 1 mayúscula',
  lowercase: 'Debe contener al menos 1 minúscula',
  number: 'Debe contener al menos 1 número',
  specialChar: 'Debe contener al menos 1 carácter especial (!@#$%^&*)',
  emailTaken: 'Este email ya está registrado',
  usernameTaken: 'Este usuario ya está registrado'
};

/**
 * Función auxiliar para obtener mensaje de error de un control
 */
export function getErrorMessage(control: AbstractControl | null, fieldLabel: string = 'Campo'): string | null {
  if (!control || !control.errors) {
    return null;
  }

  const errors = control.errors;

  for (const [errorKey, errorValue] of Object.entries(errors)) {
    switch (errorKey) {
      case 'required':
        return VALIDATION_MESSAGES.required;
      case 'minLength':
        return VALIDATION_MESSAGES.minLength((errorValue as any).requiredLength);
      case 'maxLength':
        return VALIDATION_MESSAGES.maxLength((errorValue as any).requiredLength);
      case 'pattern':
        return VALIDATION_MESSAGES.pattern;
      case 'email':
        return VALIDATION_MESSAGES.email;
      case 'invalidEmail':
        return VALIDATION_MESSAGES.invalidEmail;
      case 'invalidPhone':
        return VALIDATION_MESSAGES.invalidPhone;
      case 'invalidUrl':
        return VALIDATION_MESSAGES.invalidUrl;
      case 'invalidNumber':
        return VALIDATION_MESSAGES.invalidNumber;
      case 'outOfRange':
        return VALIDATION_MESSAGES.outOfRange((errorValue as any).min, (errorValue as any).max);
      case 'onlyWhitespace':
        return VALIDATION_MESSAGES.onlyWhitespace;
      case 'minLengthTrimmed':
        return VALIDATION_MESSAGES.minLengthTrimmed((errorValue as any).requiredLength);
      case 'notMatching':
        return VALIDATION_MESSAGES.notMatching;
      case 'uppercase':
        return VALIDATION_MESSAGES.uppercase;
      case 'lowercase':
        return VALIDATION_MESSAGES.lowercase;
      case 'number':
        return VALIDATION_MESSAGES.number;
      case 'specialChar':
        return VALIDATION_MESSAGES.specialChar;
      case 'emailTaken':
        return VALIDATION_MESSAGES.emailTaken;
      case 'usernameTaken':
        return VALIDATION_MESSAGES.usernameTaken;
      default:
        return `${fieldLabel}: ${errorKey}`;
    }
  }

  return null;
}
