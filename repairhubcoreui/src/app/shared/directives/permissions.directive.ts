import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { Permission, EmployeeType } from '../models/rbac.constants';

/**
 * Directiva *appHasPermission
 * Muestra/oculta elemento si el usuario tiene un permiso
 * 
 * Uso:
 * <button *appHasPermission="Permission.DELETE_USER">Eliminar</button>
 * <div *appHasPermission="[Permission.EDIT_ORDER, Permission.DELETE_ORDER]">Panel edición</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private permissions: Permission[] = [];

  @Input()
  set appHasPermission(permission: Permission | Permission[]) {
    this.permissions = Array.isArray(permission) ? permission : [permission];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.permissions$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView() {
    const hasPermission = this.permissionsService.hasAnyPermission(this.permissions);

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

/**
 * Directiva *appHasAllPermissions
 * Muestra/oculta elemento si el usuario tiene TODOS los permisos
 * 
 * Uso:
 * <button *appHasAllPermissions="[Permission.EDIT_ORDER, Permission.DELETE_ORDER]">
 *   Administrar Orden
 * </button>
 */
@Directive({
  selector: '[appHasAllPermissions]',
  standalone: true
})
export class HasAllPermissionsDirective implements OnInit {
  private permissions: Permission[] = [];

  @Input()
  set appHasAllPermissions(permissions: Permission[]) {
    this.permissions = permissions;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.permissions$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView() {
    const hasAllPermissions = this.permissionsService.hasAllPermissions(this.permissions);

    if (hasAllPermissions) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

/**
 * Directiva *appHasRole
 * Muestra/oculta elemento si el usuario tiene un rol específico
 * 
 * Uso:
 * <div *appHasRole="'CenterAdmin'">Panel del Admin de Centro</div>
 * <button *appHasRole="'AdminStore'">Gestionar Tienda</button>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private roles: (EmployeeType | string)[] = [];

  @Input()
  set appHasRole(role: EmployeeType | string | (EmployeeType | string)[]) {
    this.roles = Array.isArray(role) ? role : [role];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.role$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView() {
    const currentRole = this.permissionsService.getRole();
    const hasRole = this.roles.includes(currentRole as any);

    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

/**
 * Directiva *appIsAdmin
 * Muestra/oculta elemento si el usuario es administrador del sistema
 * 
 * Uso:
 * <div *appIsAdmin>Opciones de Administrador del Sistema</div>
 */
@Directive({
  selector: '[appIsAdmin]',
  standalone: true
})
export class IsAdminDirective implements OnInit {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.role$.subscribe(() => {
      const isAdmin = this.permissionsService.isAdmin();
      
      if (isAdmin) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}

/**
 * Directiva *appIsEmployeeAdmin
 * Muestra/oculta elemento si el usuario es admin de centro o tienda
 * 
 * Uso:
 * <div *appIsEmployeeAdmin>Opciones de Administrador de Ubicación</div>
 */
@Directive({
  selector: '[appIsEmployeeAdmin]',
  standalone: true
})
export class IsEmployeeAdminDirective implements OnInit {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.role$.subscribe(() => {
      const isEmployeeAdmin = this.permissionsService.isEmployeeAdmin();
      
      if (isEmployeeAdmin) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}

/**
 * Directiva *appIsAccountant
 * Muestra/oculta elemento si el usuario es contador
 * 
 * Uso:
 * <div *appIsAccountant>Opciones de Contador</div>
 */
@Directive({
  selector: '[appIsAccountant]',
  standalone: true
})
export class IsAccountantDirective implements OnInit {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.permissionsService.role$.subscribe(() => {
      const isAccountant = this.permissionsService.isAccountant();
      
      if (isAccountant) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
