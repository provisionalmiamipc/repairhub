import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UsersDetailComponent } from './users-detail.component';
import { UsersService } from '../../shared/services/users.service';
import { ToastService } from '../../shared/services/toast.service';
import { Users } from '../../shared/models/Users';
import { Subject } from 'rxjs';
import { takeUntil, tap, catchError, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

/**
 * Smart Component - Página de detalle de usuario
 */
@Component({
  selector: 'app-users-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, UsersDetailComponent],
  template: `
    <div class="container-lg py-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0">Detalle del Usuario</h1>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" routerLink="/users" routerLinkActive="active">
            <i class="icon-arrow-left me-2"></i> Back
          </button>
          <button class="btn btn-warning" routerLink="/users/{{ selectedUser?.id }}/edit">
            <i class="icon-pencil me-2"></i> Edit
          </button>
        </div>
      </div>

      <!-- Indicador de carga -->
      <div *ngIf="isLoading" class="alert alert-info text-center">
        <span class="spinner-border spinner-border-sm me-2"></span>
        Cargando usuario...
      </div>

      <!-- Detalle -->
      <div *ngIf="!isLoading && selectedUser">
        <app-users-detail [user]="selectedUser"></app-users-detail>
      </div>

      <!-- Error -->
      <div *ngIf="!isLoading && !selectedUser" class="alert alert-danger">
        <i class="icon-warning me-2"></i> No se pudo cargar el usuario
      </div>
    </div>
  `,
  providers: [UsersService, ToastService],
})
export class UsersDetailPageComponent implements OnInit, OnDestroy {
  selectedUser: Users | null = null;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const id = params['id'];
          if (!id) {
            this.toastService.error('Usuario no encontrado');
            this.router.navigate(['/users']);
            return EMPTY;
          }

          this.isLoading = true;
          return this.usersService.getById(parseInt(id, 10));
        }),
        tap((user) => {
          this.selectedUser = user;
          this.isLoading = false;
        }),
        catchError((err) => {
          this.toastService.error('Error al cargar el usuario');
          this.isLoading = false;
          this.router.navigate(['/users']);
          return EMPTY;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
