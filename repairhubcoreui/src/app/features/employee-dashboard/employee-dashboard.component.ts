// components/employee-dashboard/employee-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
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

  kpis: Array<{ title: string; value: string | number; trend: number; trendLabel: string; icon: string; color: string; progress: number; }> = [];
  statusDistribution: Array<{ label: string; value: number; color: string; }> = [];
  pipeline: Array<{ label: string; value: number; color: string; }> = [];
  alerts: Array<{ title: string; subtitle: string; level: string; }> = [];
  upcomingAppointments: Array<{ time: string; customer: string; device: string; status: string; }> = [];
  expertTasks: Array<{ order: string; task: string; eta: string; priority: string; }> = [];
  financeSummary: Array<{ label: string; value: string; change: string; color: string; }> = [];
  storePerformance: Array<{ label: string; value: number; color: string; }> = [];

  readonly quickActions = [
    { label: 'Nueva orden', icon: 'bi-plus-circle', route: '/service-orders', permission: 'canManageStore' },
    { label: 'Agendar cita', icon: 'bi-calendar2-plus', route: '/appointments', permission: 'canManageStore' },
    { label: 'Inventario', icon: 'bi-box-seam', route: '/items', permission: 'canManageInventory' },
    { label: 'Clientes', icon: 'bi-people', route: '/customers', permission: 'canViewReports' }
  ];

  constructor(
    public authService: AuthService,
    private roleService: RoleService,
    private serviceOrdersService: ServiceOrdersService,
    private appointmentsService: AppointmentsService,
    private customersService: CustomersService,
    private employeesService: EmployeesService,
    private itemsService: ItemsService
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
            title: 'Órdenes activas',
            value: activeOrders.length,
            trend: this.calcTrend(orders24, ordersPrev24),
            trendLabel: 'últimas 24h',
            icon: 'bi-clipboard-check',
            color: 'primary',
            progress: Math.round((activeOrders.length / totalOrdersSafe) * 100)
          },
          {
            title: 'Órdenes cerradas',
            value: closedOrders.length,
            trend: this.calcTrend(revenueData.closed24, revenueData.closedPrev24),
            trendLabel: 'últimas 24h',
            icon: 'bi-check2-circle',
            color: 'success',
            progress: completedPct
          },
          {
            title: 'Citas pendientes',
            value: pendingAppointments.length,
            trend: this.calcTrend(appts24, apptsPrev24),
            trendLabel: 'últimas 24h',
            icon: 'bi-calendar2-event',
            color: 'info',
            progress: Math.round((pendingAppointments.length / (appointments.length || 1)) * 100)
          },
          {
            title: 'Clientes activos',
            value: activeCustomers,
            trend: this.calcTrend(customers30, customersPrev30),
            trendLabel: 'últimos 30 días',
            icon: 'bi-people',
            color: 'primary',
            progress: 100
          },
          {
            title: 'Empleados activos',
            value: activeEmployees,
            trend: this.calcTrend(employees30, employeesPrev30),
            trendLabel: 'últimos 30 días',
            icon: 'bi-person-badge',
            color: 'secondary',
            progress: Math.min(100, Math.round((activeEmployees / (employees.length || 1)) * 100))
          },
          {
            title: 'Tiempo medio',
            value: `${avgRepairHours.toFixed(1)}h`,
            trend: this.calcTrend(avgRepairHours, revenueData.avgHoursPrev),
            trendLabel: 'promedio',
            icon: 'bi-stopwatch',
            color: 'warning',
            progress: Math.min(100, Math.round(avgRepairHours * 10))
          },
          {
            title: 'Alertas inventario',
            value: lowStockItems.length,
            trend: -Math.min(99, lowStockItems.length),
            trendLabel: 'stock bajo',
            icon: 'bi-exclamation-triangle',
            color: 'danger',
            progress: Math.min(100, Math.round((lowStockItems.length / (items.length || 1)) * 100))
          }
        ];

        this.statusDistribution = [
          { label: 'Completadas', value: completedPct, color: 'success' },
          { label: 'En progreso', value: inProgressPct, color: 'info' },
          { label: 'Canceladas', value: canceledPct, color: 'danger' }
        ];

        this.pipeline = this.buildPipeline(activeOrders);

        this.alerts = this.buildAlerts(lowStockItems, activeOrders);

        this.upcomingAppointments = this.buildUpcomingAppointments(appointments);

        this.expertTasks = this.buildExpertTasks(activeOrders);

        this.financeSummary = [
          {
            label: 'Ingresos netos (30 días)',
            value: this.formatCurrency(revenueData.revenue30),
            change: this.formatTrend(revenueData.revenue30, revenueData.revenuePrev30),
            color: 'success'
          },
          {
            label: 'Costes operativos (30 días)',
            value: this.formatCurrency(revenueData.cost30),
            change: this.formatTrend(revenueData.cost30, revenueData.costPrev30),
            color: 'info'
          },
          {
            label: 'Margen bruto',
            value: `${revenueData.marginPct.toFixed(1)}%`,
            change: this.formatTrend(revenueData.marginPct, revenueData.marginPrevPct),
            color: 'primary'
          }
        ];

        const appointmentCompletion = appointments.length
          ? Math.round((appointments.filter(a => a.cloused && !a.canceled).length / appointments.length) * 100)
          : 0;

        this.storePerformance = [
          { label: 'Tasa de cierre', value: completedPct, color: 'success' },
          { label: 'Cumplimiento citas', value: appointmentCompletion, color: 'info' },
          { label: 'Cancelaciones', value: Math.round((canceledOrders.length / totalOrdersSafe) * 100), color: 'warning' }
        ];
      });
  }

  getRoleDisplayName(): string {
    return this.employeeRole ? this.roleService.getRoleDisplayName(this.employeeRole) : '';
  }

  getWelcomeMessage(): string {
    const employee = this.authService.getCurrentEmployee();
    return employee ? `Bienvenido/a, ${employee.firstName}` : 'Bienvenido/a al panel de empleados';
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
      'Recepción': 0,
      'Diagnóstico': 0,
      'Reparación': 0,
      'Calidad': 0,
      'Entrega': 0
    };

    activeOrders.forEach(order => {
      const latestStatus = this.getLatestStatus(order);
      const stage = this.mapStatusToStage(latestStatus);
      stages[stage]++;
    });

    const total = activeOrders.length || 1;

    return [
      { label: 'Recepción', value: Math.round((stages['Recepción'] / total) * 100), color: 'primary' },
      { label: 'Diagnóstico', value: Math.round((stages['Diagnóstico'] / total) * 100), color: 'info' },
      { label: 'Reparación', value: Math.round((stages['Reparación'] / total) * 100), color: 'warning' },
      { label: 'Calidad', value: Math.round((stages['Calidad'] / total) * 100), color: 'secondary' },
      { label: 'Entrega', value: Math.round((stages['Entrega'] / total) * 100), color: 'success' }
    ];
  }

  private buildAlerts(items: Items[], activeOrders: ServiceOrders[]): Array<{ title: string; subtitle: string; level: string; }> {
    const alerts: Array<{ title: string; subtitle: string; level: string; }> = [];

    const lowStock = items.slice(0, 2);
    lowStock.forEach(item => {
      alerts.push({
        title: item.product || 'Inventario crítico',
        subtitle: `Stock crítico: ${item.stock} unidades`,
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
        title: 'Órdenes demoradas',
        subtitle: `${overdueOrders.length} órdenes superan 3 días`,
        level: 'warning'
      });
    }

    if (!alerts.length) {
      alerts.push({
        title: 'Todo bajo control',
        subtitle: 'No hay alertas críticas en este momento',
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
        time: appointment.time || (date ? date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Pendiente'),
        customer: appointment.customer || `Cliente #${appointment.id}`,
        device: appointment.device?.name || `Dispositivo #${appointment.deviceId}`,
        status: appointment.cloused ? 'Completada' : 'Confirmada'
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
        const priority = ageHours >= 72 ? 'Alta' : ageHours >= 36 ? 'Media' : 'Baja';

        return {
          order: order.orderCode || `#SO-${order.id}`,
          task: order.defectivePart || 'Diagnóstico general',
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

  private mapStatusToStage(status: string | null): 'Recepción' | 'Diagnóstico' | 'Reparación' | 'Calidad' | 'Entrega' {
    if (!status) return 'Recepción';
    const normalized = status.toLowerCase();
    if (normalized.includes('diagn')) return 'Diagnóstico';
    if (normalized.includes('repar') || normalized.includes('repair')) return 'Reparación';
    if (normalized.includes('calidad') || normalized.includes('quality')) return 'Calidad';
    if (normalized.includes('entreg') || normalized.includes('deliver') || normalized.includes('ready')) return 'Entrega';
    return 'Recepción';
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
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    } catch {
      return `€ ${value.toFixed(2)}`;
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