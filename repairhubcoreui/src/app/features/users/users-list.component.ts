import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Users } from '../../shared/models/Users';
import { HasPermissionDirective } from '../../shared/directives/permissions.directive';

/**
 * Dumb Component - Solo presenta datos y emite eventos
 * No tiene lógica, servicios ni enrutamiento
 */
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent {
  @Input() usersList: Users[] = [];
  @Input() loading: boolean | null = false;

  @Output() selectUser = new EventEmitter<Users>();
  @Output() editUser = new EventEmitter<Users>();
  @Output() deleteUser = new EventEmitter<Users>();

  /**
   * Emitir evento de selección
   */
  onSelect(user: Users): void {
    this.selectUser.emit(user);
  }

  /**
   * Emitir evento de edición
   */
  onEdit(user: Users): void {
    this.editUser.emit(user);
  }

  /**
   * Emitir evento de eliminación
   */
  onDelete(user: Users): void {
    this.deleteUser.emit(user);
  }

  /**
   * Helper para obtener clase de status
   */
  getStatusClass(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  /**
   * Helper para obtener texto de status
   */
  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }}