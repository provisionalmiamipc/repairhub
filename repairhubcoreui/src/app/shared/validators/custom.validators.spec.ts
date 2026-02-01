import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { CustomValidators } from './custom.validators';

describe('CustomValidators', () => {
  let formBuilder: FormBuilder;

  beforeEach(() => {
    formBuilder = new FormBuilder();
  });

  describe('passwordMatch()', () => {
    it('should pass when passwords match', () => {
      const form = formBuilder.group(
        {
          password: ['password123'],
          confirmPassword: ['password123'],
        },
        { validators: CustomValidators.passwordMatch('password', 'confirmPassword') }
      );

      expect(form.errors).toBeNull();
    });

    it('should fail when passwords do not match', () => {
      const form = formBuilder.group(
        {
          password: ['password123'],
          confirmPassword: ['different123'],
        },
        { validators: CustomValidators.passwordMatch('password', 'confirmPassword') }
      );

      expect(form.errors?.['passwordMismatch']).toBeTruthy();
    });

    it('should handle empty passwords', () => {
      const form = formBuilder.group(
        {
          password: [''],
          confirmPassword: [''],
        },
        { validators: CustomValidators.passwordMatch('password', 'confirmPassword') }
      );

      expect(form.errors).toBeNull();
    });
  });

  describe('phone()', () => {
    it('should accept valid phone format', () => {
      const control = new FormControl('1234567890');
      const result = CustomValidators.phone()(control);
      expect(result).toBeNull();
    });

    it('should accept phone with spaces and dashes', () => {
      const control = new FormControl('123-456-7890');
      const result = CustomValidators.phone()(control);
      expect(result).toBeNull();
    });

    it('should accept phone with parentheses', () => {
      const control = new FormControl('(123) 456-7890');
      const result = CustomValidators.phone()(control);
      expect(result).toBeNull();
    });

    it('should reject invalid phone format', () => {
      const control = new FormControl('123');
      const result = CustomValidators.phone()(control);
      expect(result?.['invalidPhone']).toBeTruthy();
    });

    it('should handle empty phone', () => {
      const control = new FormControl('');
      const result = CustomValidators.phone()(control);
      expect(result).toBeNull();
    });
  });

  describe('notGenericEmail()', () => {
    it('should reject test@example.com', () => {
      const control = new FormControl('test@example.com');
      const result = CustomValidators.notGenericEmail()(control);
      expect(result?.['genericEmail']).toBeTruthy();
    });

    it('should reject admin@admin.com', () => {
      const control = new FormControl('admin@admin.com');
      const result = CustomValidators.notGenericEmail()(control);
      expect(result?.['genericEmail']).toBeTruthy();
    });

    it('should accept real emails', () => {
      const control = new FormControl('john@company.com');
      const result = CustomValidators.notGenericEmail()(control);
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const control = new FormControl('TEST@EXAMPLE.COM');
      const result = CustomValidators.notGenericEmail()(control);
      expect(result?.['genericEmail']).toBeTruthy();
    });

    it('should handle empty email', () => {
      const control = new FormControl('');
      const result = CustomValidators.notGenericEmail()(control);
      expect(result).toBeNull();
    });
  });

  describe('strongPassword()', () => {
    it('should require minimum 8 characters', () => {
      const control = new FormControl('Short1!');
      const result = CustomValidators.strongPassword()(control);
      expect(result?.['minLength']).toBeTruthy();
    });

    it('should require uppercase letter', () => {
      const control = new FormControl('password123!');
      const result = CustomValidators.strongPassword()(control);
      expect(result?.['noUppercase']).toBeTruthy();
    });

    it('should require number', () => {
      const control = new FormControl('Password!');
      const result = CustomValidators.strongPassword()(control);
      expect(result?.['noNumber']).toBeTruthy();
    });

    it('should require special character', () => {
      const control = new FormControl('Password123');
      const result = CustomValidators.strongPassword()(control);
      expect(result?.['noSpecialChar']).toBeTruthy();
    });

    it('should accept strong password', () => {
      const control = new FormControl('StrongPass123!');
      const result = CustomValidators.strongPassword()(control);
      expect(result).toBeNull();
    });

    it('should accept various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '=', '[', ']', '{', '}', ';', ':', '\'', '"', '\\', '|', ',', '.', '<', '>', '/', '?'];
      specialChars.forEach((char) => {
        const control = new FormControl(`Password123${char}`);
        const result = CustomValidators.strongPassword()(control);
        expect(result).toBeNull();
      });
    });

    it('should handle empty password', () => {
      const control = new FormControl('');
      const result = CustomValidators.strongPassword()(control);
      expect(result).toBeNull();
    });
  });

  describe('minAge()', () => {
    it('should accept age greater than minimum', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const control = new FormControl(birthDate);
      const result = CustomValidators.minAge(18)(control);
      expect(result).toBeNull();
    });

    it('should reject age less than minimum', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15);
      const control = new FormControl(birthDate);
      const result = CustomValidators.minAge(18)(control);
      expect(result?.['minAge']).toBeTruthy();
    });

    it('should accept exact minimum age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      birthDate.setMonth(birthDate.getMonth() - 1); // Ensure it's in the past
      const control = new FormControl(birthDate);
      const result = CustomValidators.minAge(18)(control);
      expect(result).toBeNull();
    });

    it('should handle empty date', () => {
      const control = new FormControl('');
      const result = CustomValidators.minAge(18)(control);
      expect(result).toBeNull();
    });
  });

  describe('selectRequired()', () => {
    it('should reject empty string', () => {
      const control = new FormControl('');
      const result = CustomValidators.selectRequired()(control);
      expect(result?.['selectRequired']).toBeTruthy();
    });

    it('should reject null', () => {
      const control = new FormControl(null);
      const result = CustomValidators.selectRequired()(control);
      expect(result?.['selectRequired']).toBeTruthy();
    });

    it('should accept valid selection', () => {
      const control = new FormControl('option1');
      const result = CustomValidators.selectRequired()(control);
      expect(result).toBeNull();
    });

    it('should accept number zero as valid', () => {
      const control = new FormControl(0);
      const result = CustomValidators.selectRequired()(control);
      expect(result).toBeNull();
    });
  });

  describe('notPastDate()', () => {
    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const control = new FormControl(pastDate);
      const result = CustomValidators.notPastDate()(control);
      expect(result?.['pastDate']).toBeTruthy();
    });

    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const control = new FormControl(futureDate);
      const result = CustomValidators.notPastDate()(control);
      expect(result).toBeNull();
    });

    it('should accept today date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const control = new FormControl(today);
      const result = CustomValidators.notPastDate()(control);
      expect(result).toBeNull();
    });

    it('should handle empty date', () => {
      const control = new FormControl('');
      const result = CustomValidators.notPastDate()(control);
      expect(result).toBeNull();
    });
  });

  describe('dateRange()', () => {
    it('should accept date within range', () => {
      const minDate = new Date('2025-01-01');
      const maxDate = new Date('2025-12-31');
      const validDate = new Date('2025-06-15');
      const control = new FormControl(validDate);
      const result = CustomValidators.dateRange(minDate, maxDate)(control);
      expect(result).toBeNull();
    });

    it('should reject date before range', () => {
      const minDate = new Date('2025-01-01');
      const maxDate = new Date('2025-12-31');
      const invalidDate = new Date('2024-12-31');
      const control = new FormControl(invalidDate);
      const result = CustomValidators.dateRange(minDate, maxDate)(control);
      expect(result?.['dateOutOfRange']).toBeTruthy();
    });

    it('should reject date after range', () => {
      const minDate = new Date('2025-01-01');
      const maxDate = new Date('2025-12-31');
      const invalidDate = new Date('2026-01-01');
      const control = new FormControl(invalidDate);
      const result = CustomValidators.dateRange(minDate, maxDate)(control);
      expect(result?.['dateOutOfRange']).toBeTruthy();
    });

    it('should accept boundary dates', () => {
      const minDate = new Date('2025-01-01');
      const maxDate = new Date('2025-12-31');
      const control1 = new FormControl(minDate);
      const control2 = new FormControl(maxDate);
      expect(CustomValidators.dateRange(minDate, maxDate)(control1)).toBeNull();
      expect(CustomValidators.dateRange(minDate, maxDate)(control2)).toBeNull();
    });

    it('should handle empty date', () => {
      const minDate = new Date('2025-01-01');
      const maxDate = new Date('2025-12-31');
      const control = new FormControl('');
      const result = CustomValidators.dateRange(minDate, maxDate)(control);
      expect(result).toBeNull();
    });
  });

  describe('pattern()', () => {
    it('should accept pattern match', () => {
      const control = new FormControl('123456');
      const result = CustomValidators.pattern(/^\d{6}$/, 'sixDigits')(control);
      expect(result).toBeNull();
    });

    it('should reject pattern mismatch', () => {
      const control = new FormControl('12345');
      const result = CustomValidators.pattern(/^\d{6}$/, 'sixDigits')(control);
      expect(result?.['sixDigits']).toBeTruthy();
    });

    it('should handle empty value', () => {
      const control = new FormControl('');
      const result = CustomValidators.pattern(/^\d{6}$/, 'sixDigits')(control);
      expect(result).toBeNull();
    });
  });
});
