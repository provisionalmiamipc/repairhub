import { Component, OnInit } from '@angular/core';
import { AppointmentsFormComponent } from './appointments-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { Appointments } from '../../shared/models/Appointments';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointments-edit',
  standalone: true,
  imports: [ReactiveFormsModule, AppointmentsFormComponent, CommonModule],
  templateUrl: './appointments-edit.component.html',
})
export class AppointmentsEditComponent implements OnInit {
  appointment: Appointments | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsService: AppointmentsService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.loading = true;
      this.appointmentsService.getById(id).subscribe({
        next: (data) => {
          this.appointment = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else {
      // Modo creación: cita vacía
      this.appointment = {
        id: 0,
        date: '',
        // Agrega más campos según tu modelo
      } as Appointments;
    }
  }

  onSave(updated: Appointments) {
    if (this.appointment && this.appointment.id && this.appointment.id !== 0) {
      // Edición
      this.appointmentsService.update(this.appointment.id, updated).subscribe(() => {
        this.router.navigate(['/appointments']);
      });
    } else {
      // Creación
      // Ensure we don't send an `id` field when creating (some APIs reject id=0)
      const payload: any = { ...updated };
      if (payload.hasOwnProperty('id')) {
        delete payload.id;
      }
      this.appointmentsService.create(payload).subscribe(() => {
        this.router.navigate(['/appointments']);
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }
}
