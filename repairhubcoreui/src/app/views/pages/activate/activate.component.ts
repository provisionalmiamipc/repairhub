import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activate.component.html'
})
export class ActivateComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private router = inject(Router);

  token: string | null = null;
  loading = false;
  error: string | null = null;

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]]
  }, { validators: this.passwordsMatch });

  constructor() {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  private passwordsMatch(group: any) {
    const p = group.get('password')?.value;
    const c = group.get('confirm')?.value;
    return p === c ? null : { mismatch: true };
  }

  submit() {
    this.error = null;
    if (this.form.invalid) return;
    const token = this.token;
    if (!token) {
      this.error = 'Token missing in URL';
      return;
    }
    this.loading = true;
    const password = String(this.form.get('password')?.value || '');
    this.auth.activateAccount(token, password).subscribe({
      next: () => {
        this.loading = false;
        // Redirect to login with success message param
        this.router.navigate(['/login'], { queryParams: { activated: '1' } });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Activation failed';
      }
    });
  }
}
