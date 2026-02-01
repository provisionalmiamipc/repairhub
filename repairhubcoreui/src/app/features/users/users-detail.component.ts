import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Users } from '../../shared/models/Users';

/**
 * Dumb Component - Solo presenta datos del usuario
 */
@Component({
  selector: 'app-users-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-detail.component.html',
})
export class UsersDetailComponent {
  @Input() user: Users | null = null;

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