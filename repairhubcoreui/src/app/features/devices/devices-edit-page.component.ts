import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevicesService } from '../../shared/services/devices.service';
import { Devices } from '../../shared/models/Devices';
import { DevicesFormComponent } from './devices-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-devices-edit-page',
  standalone: true,
  imports: [CommonModule, DevicesFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Device</h1>
    <h1 *ngIf="isNew">New Device</h1>
    <app-devices-form
      [device]="device"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-devices-form>
  `,
})
export class DevicesEditPageComponent {
  device: Devices | null = null;
  isNew = false;

  constructor(
    private service: DevicesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(d => (this.device = d));
    }
  }

  onSave(data: Partial<Devices>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.device) {
      this.service.update(this.device.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }

  onCancel(): void {
    this.router.navigate(['/devices']); 
  }
}
