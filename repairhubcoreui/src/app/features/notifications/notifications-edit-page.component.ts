import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService } from '../../shared/services/notifications.service';
import { Notifications } from '../../shared/models/Notifications';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-notifications-edit-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notifications-edit-page.component.html',
})
export class NotificationsEditPageComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private notificationsService: NotificationsService
  ) {
    this.form = this.fb.group({
      title: [''],
      message: [''],
      type: ['system'],
      priority: ['medium'],
      status: ['unread'],
      isBroadcast: [false],
      actionUrl: [''],
      icon: [''],
  expiresAt: [''],
  metadata: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loading = true;
      this.notificationsService.getById(Number(id)).subscribe({
        next: (data) => {
          // Manejo especial para metadata y expiresAt
          this.form.patchValue({
            ...data,
            metadata: data.metadata ? JSON.stringify(data.metadata) : '',
            expiresAt: data.expiresAt ? (new Date(data.expiresAt)).toISOString().substring(0,10) : ''
          });
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    let data = this.form.value;
    // Convertir metadata a objeto si es posible
    try {
      data = {
        ...data,
        metadata: data.metadata ? JSON.parse(data.metadata) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      };
    } catch (e) {
      alert('El campo metadata debe ser un JSON válido.');
      this.loading = false;
      return;
    }
    if (this.isEdit && id) {
      this.notificationsService.update(Number(id), data).subscribe({
        next: () => this.router.navigate(['/notifications', id]),
        error: () => { this.loading = false; }
      });
    } else {
      this.notificationsService.create(data).subscribe({
        next: (res) => this.router.navigate(['/notifications', res.id]),
        error: () => { this.loading = false; }
      });
    }
  }
}
