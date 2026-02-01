import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersFormComponent } from './users-form.component';
import { UsersService } from '../../shared/services/users.service';
import { ToastService } from '../../shared/services/toast.service';
import { CreateUserDto, UpdateUserDto } from '../../shared/models/Users';
import { Subject } from 'rxjs';
import { takeUntil, tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

/**
 * Smart Component - Página de creación de usuario
 * Contiene un wrapper alrededor del formulario para manejar el guardado
 */
@Component({
  selector: 'app-users-form-page',
  standalone: true,
  imports: [CommonModule, UsersFormComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row">
        <div class="col-md-6 mx-auto">
          <app-users-form
            [isLoading]="isLoading"
            (submitForm)="onCreateUser($event)"
            (cancel)="onCancel()"
          ></app-users-form>
        </div>
      </div>
    </div>
  `,
})
export class UsersFormPageComponent implements OnInit, OnDestroy {
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Limpiar selección
    this.usersService.clearSelection();
  }

  /**
   * Crear nuevo usuario
   */
  onCreateUser(data: CreateUserDto | UpdateUserDto): void {
    this.isLoading = true;

    this.usersService
      .create(data)
      .pipe(
        tap(() => {
          this.toastService.success('Usuario creado correctamente');
          this.router.navigate(['/users']);
        }),
        catchError((err) => {
          this.toastService.error('Error al crear usuario');
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  /**
   * Cancelar creación
   */
  onCancel(): void {
    this.router.navigate(['/users']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
