import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Appointments } from '../../shared/models/Appointments';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Devices } from '../../shared/models/Devices';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { DevicesService } from '../../shared/services/devices.service';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { EmployeesService } from '../../shared/services/employees.service';

@Component({
  selector: 'app-appointments-detail',
  templateUrl: './appointments-detail.component.html',
  styleUrl: './appointments-detail.component.scss',
  standalone: true,
  imports: [CommonModule]
})
export class AppointmentsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appointmentsService = inject(AppointmentsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private devicesService = inject(DevicesService);
  private serviceTypesService = inject(ServiceTypesService);
  private employeesService = inject(EmployeesService);
  private router = inject(Router);

  appointment: Appointments | null = null;
  centerName: string = '';
  storeName: string = '';
  deviceName: string = '';
  serviceTypeName: string = '';
  createdByName: string = '';
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(parseInt(id, 10));
    } else {
      this.error = 'ID de cita no encontrado';
      this.isLoading = false;
    }
  }

  private loadAppointment(id: number): void {
    this.appointmentsService.getById(id).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.loadRelatedData(appointment);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al cargar la cita';
        this.isLoading = false;
      }
    });
  }

  private loadRelatedData(appointment: Appointments): void {
    let loadedCount = 0;
    const totalLoads = 5;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === totalLoads) {
        this.isLoading = false;
      }
    };

    // Load Center
    this.centersService.getAll().subscribe({
      next: (centers) => {
        const center = centers?.find(c => c.id === appointment.centerId);
        this.centerName = center?.centerName || `Centro #${appointment.centerId}`;
        checkComplete();
      },
      error: () => {
        this.centerName = `Centro #${appointment.centerId}`;
        checkComplete();
      }
    });

    // Load Store
    this.storesService.getAll().subscribe({
      next: (stores) => {
        const store = stores?.find(s => s.id === appointment.storeId);
        this.storeName = store?.storeName || `Tienda #${appointment.storeId}`;
        checkComplete();
      },
      error: () => {
        this.storeName = `Tienda #${appointment.storeId}`;
        checkComplete();
      }
    });

    // Load Device
    this.devicesService.getAll().subscribe({
      next: (devices) => {
        const device = devices?.find(d => d.id === appointment.deviceId);
        this.deviceName = device?.name || `Dispositivo #${appointment.deviceId}`;
        checkComplete();
      },
      error: () => {
        this.deviceName = `Dispositivo #${appointment.deviceId}`;
        checkComplete();
      }
    });

    // Load Service Type
    this.serviceTypesService.getAll().subscribe({
      next: (serviceTypes) => {
        const serviceType = serviceTypes?.find(st => st.id === appointment.serviceTypeId);
        this.serviceTypeName = serviceType?.name || `Servicio #${appointment.serviceTypeId}`;
        checkComplete();
      },
      error: () => {
        this.serviceTypeName = `Servicio #${appointment.serviceTypeId}`;
        checkComplete();
      }
    });

    // Load Created By Employee
    if (appointment.createdById) {
      this.employeesService.getAll().subscribe({
        next: (employees) => {
          const employee = employees?.find(e => e.id === appointment.createdById);
          this.createdByName = employee ? `${employee.firstName} ${employee.lastName}` : `Empleado #${appointment.createdById}`;
          checkComplete();
        },
        error: () => {
          this.createdByName = `Empleado #${appointment.createdById}`;
          checkComplete();
        }
      });
    } else {
      this.createdByName = 'N/A';
      checkComplete();
    }
  }

  goBack(): void {
    this.router.navigate(['/appointments']);
  }

  editAppointment(): void {
    if (this.appointment) {
      this.router.navigate(['/appointments', this.appointment.id, 'edit']);
    }
  }
}
