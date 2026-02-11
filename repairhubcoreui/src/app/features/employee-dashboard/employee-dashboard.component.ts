// components/employee-dashboard/employee-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { PermissionsService } from '../../shared/services/permissions.service';
import { Permission } from '../../shared/models/rbac.constants';
import { RoleService } from '../../shared/services/role.service';
import { EmployeeType } from '../../shared/models/constants/roles.constants';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { CustomersService } from '../../shared/services/customers.service';
import { EmployeesService } from '../../shared/services/employees.service';
import { ItemsService } from '../../shared/services/items.service';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { Appointments } from '../../shared/models/Appointments';
import { Customers } from '../../shared/models/Customers';
import { Employees } from '../../shared/models/Employees';
import { Items } from '../../shared/models/Items';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    HasPermissionDirective
  ],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css']
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  employeeRole: EmployeeType | null = null;
  availableModules: any[] = [];
  isLoading = true;

  readonly today = new Date();
  lastSync = new Date();

  kpis: Array<{ title: string; value: string | number; trend: number; trendLabel: string; icon: string; color: string; progress: number; requiredPermission?: Permission }> = [];
  statusDistribution: Array<{ label: string; value: number; color: string; }> = [];
  pipeline: Array<{ label: string; value: number; color: string; }> = [];
  alerts: Array<{ title: string; subtitle: string; level: string; }> = [];
  upcomingAppointments: Array<{ time: string; customer: string; device: string; status: string; }> = [];
  expertTasks: Array<{ order: string; task: string; eta: string; priority: string; }> = [];
  financeSummary: Array<{ label: string; value: string; change: string; color: string; }> = [];
  storePerformance: Array<{ label: string; value: number; color: string; }> = [];

  readonly quickActions = [
    { label: 'New order', icon: 'bi-plus-circle', route: '/service-orders/new', permission: 'canManageStore' },
    { label: 'Schedule appointment', icon: 'bi-calendar2-plus', route: '/appointments/new', permission: 'canManageStore' },
    //{ label: 'Inventario', icon: 'bi-box-seam', route: '/items', permission: 'canManageStore' },
   // { label: 'Clientes', icon: 'bi-people', route: '/customers', permission: 'canManageStore'}
  ];

  constructor(
    public authService: AuthService,
    private roleService: RoleService,
    private serviceOrdersService: ServiceOrdersService,
    private appointmentsService: AppointmentsService,
    private customersService: CustomersService,
    private employeesService: EmployeesService,
    private itemsService: ItemsService,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit(): void {
    this.loadEmployeeData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEmployeeData(): void {
    this.authService.employee$
      .pipe(takeUntil(this.destroy$))
      .subscribe(employee => {
        if (employee) {
          this.employeeRole = employee.employee_type;          
        }
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    forkJoin({
      orders: this.serviceOrdersService.getAll().pipe(catchError(() => of([] as ServiceOrders[]))),
      appointments: this.appointmentsService.getAll().pipe(catchError(() => of([] as Appointments[]))),
      customers: this.customersService.getAll().pipe(catchError(() => of([] as Customers[]))),
      employees: this.employeesService.getAll().pipe(catchError(() => of([] as Employees[]))),
      items: this.itemsService.getAll().pipe(catchError(() => of([] as Items[])))
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.lastSync = new Date();
        })
      )
      .subscribe(({ orders, appointments, customers, employees, items }) => {
        const totalOrders = orders.length;
        const activeOrders = orders.filter(order => !order.cloused && !order.canceled);
        const closedOrders = orders.filter(order => order.cloused && !order.canceled);
        const canceledOrders = orders.filter(order => order.canceled);

        const pendingAppointments = appointments.filter(appointment => !appointment.cloused && !appointment.canceled);
        const activeCustomers = customers.length;
        const activeEmployees = employees.filter(emp => !emp.isLocked).length || employees.length;

        const lowStockItems = items.filter(item => item.stock <= item.minimunStock);

        const { current: orders24, previous: ordersPrev24 } = this.countByLastHours(orders, 24);
        const { current: appts24, previous: apptsPrev24 } = this.countByLastHours(appointments, 24, 'createdAt');
        const { current: customers30, previous: customersPrev30 } = this.countByLastDays(customers, 30);
        const { current: employees30, previous: employeesPrev30 } = this.countByLastDays(employees, 30);

        const totalOrdersSafe = totalOrders || 1;
        const completedPct = totalOrders ? Math.round((closedOrders.length / totalOrdersSafe) * 100) : 0;
        const inProgressPct = totalOrders ? Math.round((activeOrders.length / totalOrdersSafe) * 100) : 0;
        const canceledPct = totalOrders ? Math.max(0, 100 - completedPct - inProgressPct) : 0;

        const avgRepairHours = this.averageRepairHours(orders);
        const revenueData = this.calculateRevenue(orders);

        this.kpis = [
          {
            title: 'Active orders',
            value: activeOrders.length,
            trend: this.calcTrend(orders24, ordersPrev24),
            trendLabel: 'last 24h',
            icon: 'bi-clipboard-check',
            color: 'primary',
            progress: Math.round((activeOrders.length / totalOrdersSafe) * 100)
          },
          {
            title: 'Closed orders',
            value: closedOrders.length,
            trend: this.calcTrend(revenueData.closed24, revenueData.closedPrev24),
            trendLabel: 'last 24h',
            icon: 'bi-check2-circle',
            color: 'success',
            progress: completedPct
          },
          {
            title: 'Pending appointments',
            value: pendingAppointments.length,
            trend: this.calcTrend(appts24, apptsPrev24),
            trendLabel: 'last 24h',
            icon: 'bi-calendar2-event',
            color: 'info',
            progress: Math.round((pendingAppointments.length / (appointments.length || 1)) * 100)
          },
          {
            title: 'Active customers',
            value: activeCustomers,
            trend: this.calcTrend(customers30, customersPrev30),
            trendLabel: 'last 30 days',
            icon: 'bi-people',
            color: 'primary',
            progress: 100
          },
          {
            title: 'Active employees',
            value: activeEmployees,
            trend: this.calcTrend(employees30, employeesPrev30),
            trendLabel: 'last 30 days',
            icon: 'bi-person-badge',
            color: 'secondary',
            progress: Math.min(100, Math.round((activeEmployees / (employees.length || 1)) * 100))
          },
          {
            title: 'Average time',
            value: `${avgRepairHours.toFixed(1)}h`,
            trend: this.calcTrend(avgRepairHours, revenueData.avgHoursPrev),
            trendLabel: 'average',
            icon: 'bi-stopwatch',
            color: 'warning',
            progress: Math.min(100, Math.round(avgRepairHours * 10))
          },
          {
            title: 'Inventory alerts',
            value: lowStockItems.length,
            trend: -Math.min(99, lowStockItems.length),
            trendLabel: 'low stock',
            icon: 'bi-exclamation-triangle',
            color: 'danger',
            progress: Math.min(100, Math.round((lowStockItems.length / (items.length || 1)) * 100))
          }
        ];

        // Mark sensitive KPIs with required permissions
        this.kpis = this.kpis.map(k => {
          if (k.title === 'Closed orders') return { ...k, requiredPermission: Permission.VIEW_ORDERS };
          if (k.title === 'Average time') return { ...k, requiredPermission: Permission.VIEW_REPORTS };
          if (k.title === 'Inventory alerts') return { ...k, requiredPermission: Permission.VIEW_INVENTORY };
          return k;
        });

        this.statusDistribution = [
          { label: 'Completed', value: completedPct, color: 'success' },
          { label: 'In progress', value: inProgressPct, color: 'info' },
          { label: 'Canceled', value: canceledPct, color: 'danger' }
        ];

        this.pipeline = this.buildPipeline(activeOrders);

        this.alerts = this.buildAlerts(lowStockItems, activeOrders);

        this.upcomingAppointments = this.buildUpcomingAppointments(appointments);

        this.expertTasks = this.buildExpertTasks(activeOrders);

        this.financeSummary = [
          {
            label: 'Net revenue (30 days)',
            value: this.formatCurrency(revenueData.revenue30),
            change: this.formatTrend(revenueData.revenue30, revenueData.revenuePrev30),
            color: 'success'
          },
          {
            label: 'Operating costs (30 days)',
            value: this.formatCurrency(revenueData.cost30),
            change: this.formatTrend(revenueData.cost30, revenueData.costPrev30),
            color: 'info'
          },
          {
            label: 'Gross margin',
            value: `${revenueData.marginPct.toFixed(1)}%`,
            change: this.formatTrend(revenueData.marginPct, revenueData.marginPrevPct),
            color: 'primary'
          }
        ];

        const appointmentCompletion = appointments.length
          ? Math.round((appointments.filter(a => a.cloused && !a.canceled).length / appointments.length) * 100)
          : 0;

        this.storePerformance = [
          { label: 'Closure rate', value: completedPct, color: 'success' },
          { label: 'Appointment compliance', value: appointmentCompletion, color: 'info' },
          { label: 'Cancellations', value: Math.round((canceledOrders.length / totalOrdersSafe) * 100), color: 'warning' }
        ];
      });
  }

  // Return only KPIs the current user can view
  get visibleKpis() {
    const employee = this.authService.getCurrentEmployee();

    // Experts who are NOT center admins have a restricted, explicit KPI set
    if (employee && employee.employee_type === 'Expert' && !employee.isCenterAdmin) {
      const allowed = new Set([
        'Active orders',
        'Closed orders',
        'Pending appointments',
        'Average time'
      ]);
      return this.kpis.filter(k => allowed.has(k.title));
    }

    // Default: respect per-KPI requiredPermission (if present)
    return this.kpis.filter(k => {
      if (!k.requiredPermission) return true;
      return this.permissionsService.hasPermission(k.requiredPermission);
    });
  }

  getRoleDisplayName(): string {
    return this.employeeRole ? this.roleService.getRoleDisplayName(this.employeeRole) : '';
  }

  getWelcomeMessage(): string {
    const employee = this.authService.getCurrentEmployee();
    return employee ? `Welcome, ${employee.firstName}` : 'Welcome to the employee dashboard';
  }

  private countByLastHours<T extends { createdAt?: Date | string }>(items: T[], hours: number, field: keyof T = 'createdAt' as keyof T): { current: number; previous: number } {
    const now = new Date();
    const currentStart = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - hours * 2 * 60 * 60 * 1000);

    const current = items.filter(item => {
      const date = this.parseDate(item[field] as unknown as Date | string);
      return date ? date >= currentStart && date <= now : false;
    }).length;

    const previous = items.filter(item => {
      const date = this.parseDate(item[field] as unknown as Date | string);
      return date ? date >= previousStart && date < currentStart : false;
    }).length;

    return { current, previous };
  }

  private countByLastDays<T extends { createdAt?: Date | string }>(items: T[], days: number): { current: number; previous: number } {
    const now = new Date();
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    const current = items.filter(item => {
      const date = this.parseDate(item.createdAt);
      return date ? date >= currentStart && date <= now : false;
    }).length;

    const previous = items.filter(item => {
      const date = this.parseDate(item.createdAt);
      return date ? date >= previousStart && date < currentStart : false;
    }).length;

    return { current, previous };
  }

  private averageRepairHours(orders: ServiceOrders[]): number {
    if (!orders.length) return 0;
    const now = new Date();
    const durations = orders.map(order => {
      const created = this.parseDate(order.createdAt) || now;
      const updated = order.cloused ? (this.parseDate(order.updatedAt) || now) : now;
      return Math.max(0, (updated.getTime() - created.getTime()) / 3600000);
    });
    const total = durations.reduce((acc, val) => acc + val, 0);
    return total / durations.length;
  }

  private calculateRevenue(orders: ServiceOrders[]) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = orders.filter(order => {
      const created = this.parseDate(order.createdAt);
      return created ? created >= thirtyDays : false;
    });

    const previousOrders = orders.filter(order => {
      const created = this.parseDate(order.createdAt);
      return created ? created >= sixtyDays && created < thirtyDays : false;
    });

    const revenue30 = recentOrders.reduce((sum, order) => sum + (order.totalCost || order.price || 0), 0);
    const cost30 = recentOrders.reduce((sum, order) => sum + (order.repairCost || 0), 0);
    const revenuePrev30 = previousOrders.reduce((sum, order) => sum + (order.totalCost || order.price || 0), 0);
    const costPrev30 = previousOrders.reduce((sum, order) => sum + (order.repairCost || 0), 0);

    const marginPct = revenue30 ? ((revenue30 - cost30) / revenue30) * 100 : 0;
    const marginPrevPct = revenuePrev30 ? ((revenuePrev30 - costPrev30) / revenuePrev30) * 100 : 0;

    const { current: closed24, previous: closedPrev24 } = this.countByLastHours(
      orders.filter(order => order.cloused && !order.canceled),
      24
    );

    const avgHoursPrev = this.averageRepairHours(previousOrders);

    return {
      revenue30,
      cost30,
      revenuePrev30,
      costPrev30,
      marginPct,
      marginPrevPct,
      closed24,
      closedPrev24,
      avgHoursPrev
    };
  }

  private buildPipeline(activeOrders: ServiceOrders[]): Array<{ label: string; value: number; color: string; }> {
    const stages = {
      'Reception': 0,
      'Diagnosis': 0,
      'Repair': 0,
      'Quality': 0,
      'Delivery': 0
    };

    activeOrders.forEach(order => {
      const latestStatus = this.getLatestStatus(order);
      const stage = this.mapStatusToStage(latestStatus);
      stages[stage]++;
    });

    const total = activeOrders.length || 1;

    return [
      { label: 'Reception', value: Math.round((stages['Reception'] / total) * 100), color: 'primary' },
      { label: 'Diagnosis', value: Math.round((stages['Diagnosis'] / total) * 100), color: 'info' },
      { label: 'Repair', value: Math.round((stages['Repair'] / total) * 100), color: 'warning' },
      { label: 'Quality', value: Math.round((stages['Quality'] / total) * 100), color: 'secondary' },
      { label: 'Delivery', value: Math.round((stages['Delivery'] / total) * 100), color: 'success' }
    ];
  }

  private buildAlerts(items: Items[], activeOrders: ServiceOrders[]): Array<{ title: string; subtitle: string; level: string; }> {
    const alerts: Array<{ title: string; subtitle: string; level: string; }> = [];

    const lowStock = items.slice(0, 2);
    lowStock.forEach(item => {
      alerts.push({
        title: item.product || 'Critical inventory',
        subtitle: `Critical stock: ${item.stock} units`,
        level: 'danger'
      });
    });

    const overdueOrders = activeOrders.filter(order => {
      const created = this.parseDate(order.createdAt);
      if (!created) return false;
      const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 3;
    });

    if (overdueOrders.length) {
      alerts.push({
        title: 'Overdue orders',
        subtitle: `${overdueOrders.length} orders exceed 3 days`,
        level: 'warning'
      });
    }

    if (!alerts.length) {
      alerts.push({
        title: 'All under control',
        subtitle: 'No critical alerts at the moment',
        level: 'info'
      });
    }

    return alerts.slice(0, 3);
  }

  private buildUpcomingAppointments(appointments: Appointments[]): Array<{ time: string; customer: string; device: string; status: string; }> {
    const now = new Date();
    return appointments
      .map(appointment => {
        const date = this.getAppointmentDate(appointment);
        return { appointment, date };
      })
      .filter(item => item.date && item.date >= now && !item.appointment.canceled)
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
      .slice(0, 3)
      .map(({ appointment, date }) => ({
        time: appointment.time || (date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Pending'),
        customer: appointment.customer || `Customer #${appointment.id}`,
        device: appointment.device?.name || `Device #${appointment.deviceId}`,
        status: appointment.cloused ? 'Completed' : 'Confirmed'
      }));
  }

  private buildExpertTasks(activeOrders: ServiceOrders[]): Array<{ order: string; task: string; eta: string; priority: string; }> {
    return activeOrders
      .sort((a, b) => {
        const dateA = this.parseDate(a.createdAt)?.getTime() || 0;
        const dateB = this.parseDate(b.createdAt)?.getTime() || 0;
        return dateA - dateB;
      })
      .slice(0, 3)
      .map(order => {
        const created = this.parseDate(order.createdAt) || new Date();
        const ageHours = Math.max(1, Math.round((Date.now() - created.getTime()) / 3600000));
        const priority = ageHours >= 72 ? 'High' : ageHours >= 36 ? 'Medium' : 'Low';

        return {
          order: order.orderCode || `#SO-${order.id}`,
          task: order.defectivePart || 'General diagnosis',
          eta: `${ageHours}h`,
          priority
        };
      });
  }

  private getLatestStatus(order: ServiceOrders): string | null {
    if (!order.repairStatuses || !order.repairStatuses.length) return null;
    const sorted = [...order.repairStatuses].sort((a, b) => {
      const dateA = this.parseDate(a.createdAt)?.getTime() || 0;
      const dateB = this.parseDate(b.createdAt)?.getTime() || 0;
      return dateB - dateA;
    });
    return sorted[0]?.status || null;
  }

  private mapStatusToStage(status: string | null): 'Reception' | 'Diagnosis' | 'Repair' | 'Quality' | 'Delivery' {
    if (!status) return 'Reception';
    const normalized = status.toLowerCase();
    if (normalized.includes('diagn')) return 'Diagnosis';
    if (normalized.includes('repar') || normalized.includes('repair')) return 'Repair';
    if (normalized.includes('calidad') || normalized.includes('quality')) return 'Quality';
    if (normalized.includes('entreg') || normalized.includes('deliver') || normalized.includes('ready')) return 'Delivery';
    return 'Reception';
  }

  private getAppointmentDate(appointment: Appointments): Date | null {
    if (appointment.date) {
      const dateTime = appointment.time ? `${appointment.date}T${appointment.time}` : appointment.date;
      const parsed = new Date(dateTime);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return this.parseDate(appointment.createdAt);
  }

  private parseDate(value?: Date | string): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    } catch {
      return `$ ${value.toFixed(2)}`;
    }
  }

  private calcTrend(current: number, previous: number): number {
    if (!previous) return current ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private formatTrend(current: number, previous: number): string {
    const trend = this.calcTrend(current, previous);
    const sign = trend >= 0 ? '+' : '';
    return `${sign}${trend}%`;
  }

  // Verifica si el usuario tiene acceso a funciones de gestión (AdminStore o CenterAdmin)
  canAccessStoreManagement(): boolean {
    const employee = this.authService.getCurrentEmployee();
    if (!employee) return false;
    return employee.employee_type === 'AdminStore' || employee.isCenterAdmin === true;
  }

  // Verifica si el usuario tiene acceso a funciones financieras (Accountant o CenterAdmin)
  canAccessFinance(): boolean {
    const employee = this.authService.getCurrentEmployee();
    if (!employee) return false;
    return employee.employee_type === 'Accountant' || employee.isCenterAdmin === true;
  }

  // Verifica si el usuario tiene acceso a tareas técnicas (Expert o CenterAdmin)
  canAccessExpertTasks(): boolean {
    const employee = this.authService.getCurrentEmployee();
    if (!employee) return false;
    return employee.employee_type === 'Expert' || employee.isCenterAdmin === true;
  }

  logout(): void {
    this.authService.logout();
  }
}