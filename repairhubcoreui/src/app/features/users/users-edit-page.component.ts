import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UsersFormComponent } from './users-form.component';
import { UsersService } from '../../shared/services/users.service';
import { ToastService } from '../../shared/services/toast.service';
import { CreateUserDto, UpdateUserDto, Users } from '../../shared/models/Users';
import { Subject } from 'rxjs';
import { takeUntil, tap, catchError, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

/**
 * Smart Component - Página de edición de usuario
 */
@Component({
  selector: 'app-users-edit-page',
  standalone: true,
  imports: [CommonModule, UsersFormComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row">
        <div class="col-md-6 mx-auto">
          <!-- Indicador de carga inicial -->
          <div *ngIf="isLoadingUser" class="alert alert-info text-center">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Loading user...
          </div>

          <!-- Formulario -->
          <app-users-form
            *ngIf="!isLoadingUser"
            [user]="selectedUser"
            [isLoading]="isSaving"
            (submitForm)="onUpdateUser($event)"
            (cancel)="onCancel()"
          ></app-users-form>
        </div>
      </div>
    </div>
  `,
  providers: [UsersService, ToastService],
})
export class UsersEditPageComponent implements OnInit, OnDestroy {
  selectedUser: Users | null = null;
  isLoadingUser = false;
  isSaving = false;
  private destroy$ = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Obtener ID desde la ruta
    this.route.params
      .pipe(
        switchMap((params) => {
          const id = params['id'];
          if (!id) {
            this.toastService.error('Usuario no encontrado');
            this.router.navigate(['/users']);
            return EMPTY;
          }

          this.isLoadingUser = true;
          return this.usersService.getById(parseInt(id, 10));
        }),
        tap((user) => {
          this.selectedUser = user;
          this.isLoadingUser = false;
        }),
        catchError((err) => {
          this.toastService.error('Error al cargar el usuario');
          this.isLoadingUser = false;
          this.router.navigate(['/users']);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Actualizar usuario existente
   */
  onUpdateUser(data: CreateUserDto | UpdateUserDto): void {
    if (!this.selectedUser) return;

    this.isSaving = true;

    this.usersService
      .update(this.selectedUser.id, data)
      .pipe(
        tap(() => {
          this.toastService.success('Usuario actualizado correctamente');
          this.router.navigate(['/users']);
        }),
        catchError((err) => {
          this.toastService.error('Error updating user');
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        complete: () => {
          this.isSaving = false;
        },
      });
  }

  /**
   * Cancelar edición
   */
  onCancel(): void {
    this.router.navigate(['/users']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

