import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';


import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective,
  INavData
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';
import { PermissionsService } from '../../shared/services/permissions.service';
import { AuthService } from '../../shared/services/auth.service';
import { UserType, EmployeeType } from '../../shared/models/rbac.constants';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,    
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})
export class DefaultLayoutComponent implements OnInit {
  public navItems: INavData[] = [];

  constructor(private permissionsService: PermissionsService, private authService: AuthService) {}

  ngOnInit(): void {
    // Filtrar items del menú basado en el rol del usuario
    this.permissionsService.role$.subscribe(() => {
      this.navItems = this.filterNavItems(navItems);
    });
  }

  /**
   * Filtra los items de navegación basado en los roles del usuario actual
   */
  private filterNavItems(items: any[]): INavData[] {
    const currentRole = this.permissionsService.getRole();
    const employee = this.authService.getCurrentEmployee();
    
    console.log('🔍 Filtrando menú:', {
      currentRole,
      employee,
      isCenterAdmin: employee?.isCenterAdmin,
      employeeType: employee?.employee_type
    });
    
    return items
      .filter(item => this.canViewItem(item, currentRole))
      .map(item => ({
        ...item,
        children: item.children ? this.filterNavItems(item.children) : undefined
      }));
  }

  /**
   * Determina si un item debe ser visible basado en el rol
   */
  private canViewItem(item: any, currentRole: UserType | EmployeeType | null): boolean {
    const employee = this.authService.getCurrentEmployee();

    // Hide items explicitly marked for Expert non-center-admin
    if (item.hideForExpertNonCenterAdmin && employee?.employee_type === EmployeeType.EXPERT && !employee?.isCenterAdmin) {
      console.log(`🔒 Hiding ${item.name || item.url} for Expert non-center-admin`);
      return false;
    }
    // Si no tiene roles definidos, visible para todos
    if (!item.roles) {
      return true;
    }

    // Si roles es un array, verificar si el rol actual está incluido
    if (Array.isArray(item.roles)) {
      const hasRole = item.roles.includes(currentRole as any);
      
      // Si ya tiene el rol, retornar true
      if (hasRole) {
        console.log(`✅ ${item.url} - Usuario tiene rol ${currentRole}`);
        return true;
      }
      
      // Si no tiene el rol pero es Center Admin, permitir items de administración especiales
      // EXCEPTO /centers que es solo para USER
      const employee = this.authService.getCurrentEmployee();
      if (employee?.isCenterAdmin && item.url !== '/centers') {
        if (item.url === '/stores' || item.url === '/employees' || item.url === '/devices' || item.url === '/device-brands' || item.url === '/service-types' || item.url === '/login') {
          console.log(`✅ ${item.url} - CenterAdmin permitido`);
          return true;
        }
      }
      
      console.log(`❌ ${item.url} - No permitido. currentRole=${currentRole}, isCenterAdmin=${employee?.isCenterAdmin}, roles=${item.roles}`);
      return false;
    }

    return false;
  }
}
