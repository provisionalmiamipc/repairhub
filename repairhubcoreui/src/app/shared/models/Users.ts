/**
 * Modelo de Usuario del Sistema (Admin)
 * Acceso completo a todas las funcionalidades
 */
export interface Users {
  id: number;
  email: string;
  password?: string; // Solo en creación
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para creación de usuario
 */
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

/**
 * DTO para actualización de usuario
 */
export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

