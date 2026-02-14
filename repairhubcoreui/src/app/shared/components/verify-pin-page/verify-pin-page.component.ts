import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PinInputModalComponent } from '../pin-input-modal/pin-input-modal.component';

/**
 * Verify PIN Page Component
 * 
 * Mostrada en dos casos:
 * 1. Después de login exitoso para empleados (no ha verificado PIN en esta sesión)
 * 2. Cuando empleado inactivo quiere reactivar sesión
 * 3. Cuando usuario hace click en "Lock Account" manualmente
 * 
 * No se puede cerrar este modal - requiere PIN válido para proceder.
 */
@Component({
  selector: 'app-verify-pin-page',
  standalone: true,
  imports: [CommonModule, PinInputModalComponent],
  template: `
    <div class="verify-pin-container">
      <app-pin-input-modal
        [isOpen]="true"
        [employeeName]="employeeName"
        (pinSubmit)="onPinSubmit($event)"
        (cancel)="onCancel()"
      ></app-pin-input-modal>
    </div>
  `,
  styles: [`
    .verify-pin-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--cui-body-bg);
    }
  `]
})
export class VerifyPinPageComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  employeeName = '';
  pinError = '';
  attemptCount = 0;
  maxAttempts = 3;

  @ViewChild(PinInputModalComponent) pinModal?: PinInputModalComponent;

  ngOnInit(): void {
    this.employeeName = this.authService.getEmployeeFullName();
  }

  onPinSubmit(pin: string): void {
    this.authService.unlockSession(pin).subscribe({
      next: (response) => {
        if (response.verified) {
          // PIN válido - marcar como verificado
          this.authService.setPinVerified(true);
          
          // Obtener URL de retorno ANTES de limpiar
          const returnUrl = this.authService.getReturnUrl();
          
          
          // Navegar a la URL guardada
          // Usar setTimeout para asegurar que se procesa después del PIN verify
          setTimeout(() => {
            this.authService.clearReturnUrl();
            if (returnUrl && returnUrl !== '/employee/dashboard') {
              this.router.navigateByUrl(returnUrl);
            } else {
              this.router.navigate(['/employee/dashboard']);
            }
          }, 100);
        } else {
          // PIN inválido
          this.handlePinError(response.error || 'Invalid PIN. Please try again.');
        }
      },
      error: (error) => {
        this.handlePinError(error?.error?.message || 'PIN verification failed. Please try again.');
      }
    });
  }

  onCancel(): void {
    // Desloguear al usuario si cancela desde verify-pin
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private handlePinError(message: string): void {
    this.pinError = message;
    this.attemptCount++;

    // Resetear loading state en el modal
    if (this.pinModal) {
      this.pinModal.onPinError(message);
    }

    if (this.attemptCount >= this.maxAttempts) {
      // Logout después de max intentos
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2000);
    }
  }
}
