/**
 * PIN Input Modal Component
 * 
 * Modal para que empleados ingresen su PIN de seguridad después de login inicial.
 * Se muestra solo cuando el login requiere verificación de PIN (empleados).
 * 
 * @example
 * <app-pin-input-modal 
 *   [isOpen]="showPinModal"
 *   [employeeName]="'Juan García'"
 *   (pinSubmit)="handlePinSubmit($event)"
 *   (cancel)="handleCancel()">
 * </app-pin-input-modal>
 */

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pin-input-modal',
  templateUrl: './pin-input-modal.component.html',
  styleUrls: ['./pin-input-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PinInputModalComponent implements OnInit {
  /**
   * Controla si el modal está visible
   */
  @Input() isOpen = false;

  /**
   * Nombre del empleado para mostrar en el modal
   */
  @Input() employeeName = 'Empleado';

  /**
   * Emite el PIN ingresado cuando el usuario lo envía
   */
  @Output() pinSubmit = new EventEmitter<string>();

  /**
   * Emite cuando el usuario cancela
   */
  @Output() cancel = new EventEmitter<void>();

  pinForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  attemptCount = 0;
  maxAttempts = 3;

  constructor(private formBuilder: FormBuilder) {
    this.createForm();
  }

  ngOnInit() {
    this.createForm();
  }

  /**
   * Crear formulario reactivo para el PIN
   * - PIN requerido
   * - Mínimo 4 dígitos
   * - Máximo 6 dígitos
   * - Solo números
   */
  private createForm(): void {
    this.pinForm = this.formBuilder.group({
      pin: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(6),
        Validators.pattern(/^\d+$/)  // Solo números
      ]]
    });
  }

  /**
   * Enviar PIN cuando el formulario es válido
   */
  onSubmit(): void {
    if (this.pinForm.valid && !this.isLoading) {
      const pin = this.pinForm.get('pin')?.value;
      this.isLoading = true;
      this.errorMessage = '';
      this.pinSubmit.emit(pin);
    }
  }

  /**
   * Cancelar y cerrar modal
   */
  onCancel(): void {
    this.resetForm();
    this.cancel.emit();
  }

  /**
   * Manejar error de PIN incorrecto
   */
  onPinError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    this.attemptCount++;

    // Desactivar submit si se alcanzó el máximo de intentos
    if (this.attemptCount >= this.maxAttempts) {
      this.pinForm.disable();
      this.errorMessage = `Máximo de intentos alcanzado (${this.maxAttempts}). Cierre sesión e intente nuevamente.`;
    }

    // Limpiar campo PIN
    this.pinForm.patchValue({ pin: '' });
  }

  /**
   * Resetear formulario después de éxito o cancelación
   */
  private resetForm(): void {
    this.pinForm.reset();
    this.errorMessage = '';
    this.isLoading = false;
    this.attemptCount = 0;
  }

  /**
   * Validar si el campo PIN tiene error
   */
  getPinError(): string {
    const pinControl = this.pinForm.get('pin');
    
    if (!pinControl || !pinControl.errors || !pinControl.touched) {
      return '';
    }

    if (pinControl.errors['required']) {
      return 'El PIN es requerido';
    }
    if (pinControl.errors['minlength']) {
      return 'El PIN debe tener al menos 4 dígitos';
    }
    if (pinControl.errors['maxlength']) {
      return 'El PIN no puede exceder 6 dígitos';
    }
    if (pinControl.errors['pattern']) {
      return 'El PIN solo puede contener números';
    }

    return '';
  }

  /**
   * Formattear PIN mientras se escribe (espacios cada 2 dígitos)
   */
  onPinInput(event: any): void {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    this.pinForm.patchValue({ pin: value }, { emitEvent: false });
  }
}
