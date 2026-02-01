// components/login/login.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PinInputModalComponent } from '../pin-input-modal/pin-input-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PinInputModalComponent],
  templateUrl: './login.component.html',
  //styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  // --- commented block (preserve admin toggle logic for future) ---
  /*
  // If you want to re-enable admin/employee toggle in future, restore the following:
  isAdminLogin = false;

  // inside onLogin() use:
  const loginObservable = this.isAdminLogin
    ? this.authService.loginUser(this.username, this.password)
    : this.authService.loginEmployee(this.username, this.password);

  // and inside handleSuccessfulLogin(response):
  if (this.isAdminLogin) {
    this.router.navigate(['/admin/dashboard']);
  } else {
    this.router.navigate(['/employee/dashboard']);
  }
  */
  // --- end commented block ---
  errorMessage = '';
  isLoading = false;
  loginAttempted = false;

  // PIN Modal properties
  showPinModal = false;
  employeeName = '';
  pinModalError = '';
  currentUserType: 'employee' | 'user' | null = null;

  @ViewChild(PinInputModalComponent) pinModal?: PinInputModalComponent;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al dashboard
    // Este es un fallback adicional por si el guard no funciona
    if (this.authService.isLoggedIn()) {
      const userType = this.authService.getUserType();
      if (userType === 'employee') {
        this.router.navigate(['/employee/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  onLogin(): void {
    this.loginAttempted = true;
    // Validaciones básicas
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Use unified login endpoint (backend should return userType + either employee or user)
    const loginObservable = this.authService.login(this.username, this.password);

    loginObservable.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.handleSuccessfulLogin(response);
      },
      error: (error) => {
        this.isLoading = false;
        this.handleLoginError(error);
      }
    });
  }

  private handleSuccessfulLogin(response: any): void {
    // Decide landing based on the returned userType
    // - 'user' is the super-admin (single user type)
    // - 'employee' will include employee.employee_type to drive permissions
    try {
      if (response?.userType === 'user') {
        // Super-admin - no PIN required, navigate directly
        this.router.navigate(['/dashboard']);
        return;
      }

      if (response?.userType === 'employee' && response?.employee) {
        // Employee login - require PIN verification before dashboard access
        this.currentUserType = 'employee';
        this.employeeName = `${response.employee.firstName} ${response.employee.lastName}`;
        this.showPinModal = true;
        return;
      }

      // Fallback
      this.router.navigate(['/dashboard']);
    } catch (e) {
      this.router.navigate(['/dashboard']);
    }
  }

  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.errorMessage = 'Invalid username or password';
    } else if (error.status === 0) {
      this.errorMessage = 'Cannot connect to server. Please try again later.';
    } else {
      this.errorMessage = 'Login failed. Please try again.';
    }
  }

  /**
   * Maneja el envío del PIN desde el modal
   */
  onPinSubmit(pin: string): void {
    this.authService.verifyPin(pin).subscribe({
      next: (response) => {
        if (response.verified) {
          // PIN válido - marcar como verificado y navegar
          this.authService.setPinVerified(true);
          this.showPinModal = false;
          this.router.navigate(['/employee/dashboard']);
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

  /**
   * Maneja la cancelación del PIN modal - Desloguear usuario
   */
  onPinCancel(): void {
    // Resetear estado y desloguear
    this.showPinModal = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Maneja errores de PIN
   */
  private handlePinError(message: string): void {
    this.pinModalError = message;
    // Resetear loading state en el modal
    if (this.pinModal) {
      this.pinModal.onPinError(message);
    }
  }

  // admin toggle removed; no toggle method required
}