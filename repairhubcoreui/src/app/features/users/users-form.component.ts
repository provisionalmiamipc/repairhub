import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Users, CreateUserDto, UpdateUserDto } from '../../shared/models/Users';
import { CustomValidators } from '../../shared/validators/custom.validators';
import { ToastService } from '../../shared/services/toast.service';

/**
 * Componente de Formulario para Usuarios
 * Soporta creación y edición
 */
@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-form.component.html',
})
export class UsersFormComponent implements OnInit, OnChanges {
  @Input() user: Users | null = null;
  @Input() isLoading = false;
  @Output() submitForm = new EventEmitter<CreateUserDto | UpdateUserDto>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditMode = false;
  passwordVisible = false;
  confirmPasswordVisible = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Crear validadores basado en el modo
    this.updateValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.isEditMode = true;
      this.form.patchValue({
        email: this.user.email,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
      });
      // En modo edición, no requerimos contraseña
      this.form.get('password')?.clearAsyncValidators();
    }
  }

  /**
   * Inicializar formulario reactivo
   */
  private initializeForm(): void {
    this.form = this.fb.group(
      {
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            CustomValidators.notGenericEmail(),
          ],
        ],
        firstName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        lastName: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        password: [
          '',
          [
            Validators.minLength(8),
            CustomValidators.strongPassword(),
          ],
        ],
        confirmPassword: [''],
      },
      {
        validators: [
          CustomValidators.passwordMatch('password', 'confirmPassword'),
        ],
      }
    );
  }

  /**
   * Actualizar validadores según modo
   */
  private updateValidators(): void {
    const passwordControl = this.form.get('password');
    const confirmPasswordControl = this.form.get('confirmPassword');

    if (this.isEditMode) {
      // En edición, contraseña es opcional
      passwordControl?.setValidators([
        Validators.minLength(8),
        CustomValidators.strongPassword(),
      ]);
      confirmPasswordControl?.setValidators([]);
    } else {
      // En creación, contraseña es requerida
      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(8),
        CustomValidators.strongPassword(),
      ]);
      confirmPasswordControl?.setValidators([
        Validators.required,
      ]);
    }

    passwordControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
  }

  /**
   * Enviar formulario
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor completa todos los campos correctamente');
      return;
    }

    const formValue = this.form.value;

    if (this.isEditMode) {
      // Modo edición: no incluir password si está vacío
      const updateData: UpdateUserDto = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
      };
      this.submitForm.emit(updateData);
    } else {
      // Modo creación: requiere password
      const createData: CreateUserDto = {
        ...formValue,
      };
      this.submitForm.emit(createData);
    }
  }

  /**
   * Cancelar edición
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Alternar visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'email':
        if (errors['required']) return 'Email es requerido';
        if (errors['email']) return 'Email inválido';
        if (errors['genericEmail']) return 'Email genérico no permitido';
        break;

      case 'firstName':
        if (errors['required']) return 'Nombre es requerido';
        if (errors['minlength']) return 'Mínimo 2 caracteres';
        if (errors['maxlength']) return 'Máximo 50 caracteres';
        break;

      case 'lastName':
        if (errors['required']) return 'Apellido es requerido';
        if (errors['minlength']) return 'Mínimo 2 caracteres';
        if (errors['maxlength']) return 'Máximo 50 caracteres';
        break;

      case 'password':
        if (errors['required']) return 'Contraseña es requerida';
        if (errors['minlength']) return 'Mínimo 8 caracteres';
        if (errors['noUppercase']) return 'Debe contener una mayúscula';
        if (errors['noNumber']) return 'Debe contener un número';
        if (errors['noSpecialChar']) return 'Debe contener un carácter especial';
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Confirm password is required';
        break;
    }

    return 'Campo inválido';
  }

  /**
   * Verificar si un campo es inválido y fue tocado
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Verificar si el formulario tiene error de matching de passwords
   */
  hasPasswordMismatch(): boolean {
    const passwordMismatch = this.form.errors?.['passwordMismatch'];
    const confirmPasswordTouched = this.form.get('confirmPassword')?.touched;
    return !!(passwordMismatch && confirmPasswordTouched);
  }
}

