import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, first } from 'rxjs/operators';

/**
 * Colección de validadores personalizados reutilizables
 */
export class CustomValidators {
  /**
   * Validar que las contraseñas coincidan
   */
  static passwordMatch(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as any;
      const password = group.get(passwordField)?.value;
      const confirmPassword = group.get(confirmPasswordField)?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  /**
   * Validar teléfono (10 dígitos)
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      return phoneRegex.test(control.value) ? null : { invalidPhone: true };
    };
  }

  /**
   * Validar que no sea un email genérico
   */
  static notGenericEmail(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const genericDomains = ['test@example.com', 'admin@admin.com', 'user@user.com'];
      const isGeneric = genericDomains.some((domain) => control.value.toLowerCase() === domain);
      return isGeneric ? { genericEmail: true } : null;
    };
  }

  /**
   * Validar longitud mínima de contraseña
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = control.value;
      const errors: ValidationErrors = {};

      // Mínimo 8 caracteres
      if (password.length < 8) {
        errors['minLength'] = true;
      }

      // Al menos una mayúscula
      if (!/[A-Z]/.test(password)) {
        errors['noUppercase'] = true;
      }

      // Al menos un número
      if (!/[0-9]/.test(password)) {
        errors['noNumber'] = true;
      }

      // Al menos un carácter especial
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors['noSpecialChar'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * Validador asíncrono - Email único
   * Se debe pasar el servicio que verifica la existencia
   */
  static uniqueEmail(checkFn: (email: string) => Observable<boolean>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return control.valueChanges
        .pipe(
          debounceTime(300),
          first(),
          // En subscribe usar switchMap o flatMap si es necesario
        ) as Observable<any>;
    };
  }

  /**
   * Validador de edad mínima
   */
  static minAge(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= minAge ? null : { minAge: { requiredAge: minAge, actualAge: age } };
    };
  }

  /**
   * Validador de número de teléfono único (async)
   */
  static uniquePhone(checkFn: (phone: string) => Observable<boolean>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return checkFn(control.value).pipe(
        debounceTime(300),
        map((exists) => (exists ? { uniquePhone: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador de patrón personalizado
   */
  static pattern(regex: RegExp, errorKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      return regex.test(control.value) ? null : { [errorKey]: true };
    };
  }

  /**
   * Validador de selección requerida (para dropdowns)
   */
  static selectRequired(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      // Permitir 0 como valor válido (opción con ID 0)
      if (value === '' || value === null || value === undefined) {
        return { selectRequired: true };
      }
      return null;
    };
  }

  /**
   * Validador de fecha - No pasada
   */
  static notPastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return date >= today ? null : { pastDate: true };
    };
  }

  /**
   * Validador de rango de fecha
   */
  static dateRange(minDate: Date, maxDate: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const date = new Date(control.value);
      return date >= minDate && date <= maxDate ? null : { dateOutOfRange: true };
    };
  }
}
