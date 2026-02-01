// directives/has-role.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Uso: <div *appHasRole="['AdminStore','Accountant']">...</div>
 * - Si el actor es `user` (super-admin) siempre mostrará.
 * - Si es `employee` mostrará sólo si su employee_type está en la lista.
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnDestroy {
  @Input('appHasRole') allowedRoles: string[] | string = [];

  private auth = inject(AuthService);
  private tpl = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);
  private sub: Subscription;

  constructor() {
    this.sub = this.auth.employee$.subscribe(() => this.updateView());
    // also react to user changes
    this.auth.user$.subscribe(() => this.updateView());
  }

  private normalizeAllowed(): string[] {
    if (!this.allowedRoles) return [];
    return Array.isArray(this.allowedRoles) ? this.allowedRoles : [String(this.allowedRoles)];
  }

  private updateView(): void {
    const userType = this.auth.getUserType();
    const allowed = this.normalizeAllowed();

    // super-admin sees everything
    if (userType === 'user') {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      return;
    }

    const currentRole = this.auth.getCurrentEmployeeRole();
    if (currentRole && allowed.length > 0 && allowed.includes(currentRole)) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
    } else if (allowed.length === 0) {
      // no roles specified -> show by default
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
