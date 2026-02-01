// directives/has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';

/**
 * Uso: <div *appHasPermission="'canManageStore'">...</div>
 * o: <div *appHasPermission="['canManageStore','canViewReports']">...</div>
 * Comprueba permisos declarados en `RoleService` para el role actual.
 * Los `user` (super-admin) siempre pasan.
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnDestroy {
  @Input('appHasPermission') permissions: string | string[] = [];

  private auth = inject(AuthService);
  private roleService = inject(RoleService);
  private tpl = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);
  private sub: Subscription;

  constructor() {
    this.sub = this.auth.employee$.subscribe(() => this.updateView());
    this.auth.user$.subscribe(() => this.updateView());
  }

  private normalize(): string[] {
    if (!this.permissions) return [];
    return Array.isArray(this.permissions) ? this.permissions : [String(this.permissions)];
  }

  private updateView(): void {
    const userType = this.auth.getUserType();
    const perms = this.normalize();

    if (userType === 'user') {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      return;
    }

    const role = this.auth.getCurrentEmployeeRole();
    if (!role) {
      this.vcr.clear();
      return;
    }

    // if no permissions specified show by default
    if (perms.length === 0) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      return;
    }

    // all permissions must be satisfied (AND). You can change to ANY (OR) if desired.
    const ok = perms.every(p => this.roleService.hasPermission(role, p as any));
    if (ok) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
