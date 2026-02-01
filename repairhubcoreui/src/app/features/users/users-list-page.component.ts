import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersListComponent } from './users-list.component';
import { UsersService } from '../../shared/services/users.service';
import { Users } from '../../shared/models/Users';
import { ToastService } from '../../shared/services/toast.service';
import {
  combineLatest,
  Observable,
  Subject,
  map,
  startWith,
  takeUntil,
  EMPTY,
} from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * Smart Component - Maneja lógica, servicios y routing
 * Delega presentación a UsersListComponent (Dumb)
 */
@Component({
  selector: 'app-users-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UsersListComponent],
  template: `
    <div class="container-lg py-4">
      <!-- Header con título y botón nuevo -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3 mb-0">Gestión de Usuarios</h1>
        <button class="btn btn-primary" routerLink="/users/new">
          <i class="icon-plus me-2"></i> Nuevo Usuario
        </button>
      </div>

      <!-- Barra de búsqueda -->
      <div class="card mb-4">
        <div class="card-body">
          <input
            type="text"
            class="form-control"
            placeholder="Buscar por email o nombre..."
            [formControl]="searchControl"
          />
        </div>
      </div>

      <!-- Indicador de carga -->
      <div *ngIf="loading$ | async" class="alert alert-info">
        <i class="icon-spinner me-2"></i> Cargando usuarios...
      </div>

      <!-- Mensaje de error -->
      <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show">
        <i class="icon-warning me-2"></i> {{ error }}
        <button type="button" class="btn-close" (click)="clearError()"></button>
      </div>

      <!-- Lista de usuarios -->
      <div *ngIf="(filteredUsers$ | async) as users; else empty">
        <app-users-list
          [usersList]="users"
          [loading]="loading$ | async"
          (selectUser)="viewUser($event)"
          (editUser)="editUser($event)"
          (deleteUser)="deleteUser($event)"
        ></app-users-list>

        <!-- Paginación simple -->
        <div class="mt-4 text-center text-muted" *ngIf="users.length > 0">
          Mostrando {{ users.length }} de {{ (totalUsers$ | async) || 0 }} usuarios
        </div>
      </div>

      <!-- Template vacío -->
      <ng-template #empty>
        <div class="alert alert-info text-center py-5">
          <i class="icon-info me-2"></i> No hay usuarios para mostrar
        </div>
      </ng-template>
    </div>
  `,
  providers: [UsersService, ToastService],
})
export class UsersListPageComponent implements OnInit, OnDestroy {
  // Observables para la vista
  users$ = this.usersService.data$;
  loading$ = this.usersService.loading$;
  error$ = this.usersService.error$;

  // Total de usuarios
  totalUsers$ = this.users$.pipe(map((users) => users.length));

  // Control de búsqueda
  searchControl = new FormControl('');

  // Usuarios filtrados por búsqueda
  filteredUsers$: Observable<Users[]>;

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private router: Router,
    private toastService: ToastService
  ) {
    // Combinar usuarios con búsqueda
    this.filteredUsers$ = combineLatest([
      this.users$,
      this.searchControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([users, search]) => {
        if (!search) {
          return users;
        }

        const searchLower = search.toLowerCase();
        return users.filter(
          (user) =>
            user.email.toLowerCase().includes(searchLower) ||
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower)
        );
      })
    );
  }

  ngOnInit(): void {
    // Cargar usuarios al inicializar
    this.usersService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Los datos se actualizan automáticamente vía BehaviorSubject
        },
        error: () => {
          this.toastService.error('Error al cargar usuarios');
        },
      });
  }

  /**
   * Ver detalle de usuario
   */
  viewUser(user: Users): void {
    this.usersService.select(user);
    this.router.navigate(['/users', user.id]);
  }

  /**
   * Editar usuario
   */
  editUser(user: Users): void {
    this.usersService.select(user);
    this.router.navigate(['/users', user.id, 'edit']);
  }

  /**
   * Eliminar usuario con confirmación
   */
  deleteUser(user: Users): void {
    const message = `¿Eliminar usuario ${user.firstName} ${user.lastName}?`;

    if (confirm(message)) {
      this.usersService
        .delete(user.id)
        .pipe(
          tap(() => {
            this.toastService.success('Usuario eliminado correctamente');
          }),
          catchError((err) => {
            this.toastService.error('Error al eliminar usuario');
            return EMPTY;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe();
    }
  }

  /**
   * Limpiar mensaje de error
   */
  clearError(): void {
    this.usersService.clearError();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
