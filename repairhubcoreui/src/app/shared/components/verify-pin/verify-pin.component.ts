// components/verify-pin/verify-pin.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-pin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-pin.component.html',
  //styleUrls: ['./verify-pin.component.css']
})
export class VerifyPinComponent {
  pin = '';
  errorMessage = '';
  isLoading = false;
  attempts = 0;
  maxAttempts = 3;

  constructor(private authService: AuthService, private router: Router) {}

  verifyPin(): void {
    if (this.pin.length !== 4) {
      this.errorMessage = 'PIN must be 4 digits';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.unlockSession(this.pin).subscribe({
      next: (valid) => {
        this.isLoading = false;
        if (valid) {
          this.router.navigate(['/employee/dashboard']);
        } else {
          this.attempts++;
          if (this.attempts >= this.maxAttempts) {
            this.errorMessage = 'Too many failed attempts. Please contact administrator.';
            this.authService.logout();
          } else {
            this.errorMessage = `Invalid PIN. ${this.maxAttempts - this.attempts} attempts remaining.`;
            this.pin = '';
          }
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error verifying PIN. Please try again.';
        this.pin = '';
      }
    });
  }

  onPinInput(event: any): void {
    // Allow only numbers
    this.pin = event.target.value.replace(/[^0-9]/g, '');
    
    // Auto-submit when 4 digits entered
    if (this.pin.length === 4) {
      this.verifyPin();
    }
  }

  onLogout(): void {
    // Desloguear y redirigir a login
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}