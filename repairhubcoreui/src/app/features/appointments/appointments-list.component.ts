import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { Appointments } from '../../shared/models/Appointments';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './appointments-list.component.html',
})
export class AppointmentsListComponent implements OnInit {
  appointments: Appointments[] = [];
  loading = false;

  constructor(private appointmentsService: AppointmentsService) {}

  ngOnInit(): void {
    this.loading = true;
    this.appointmentsService.getAll().subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
