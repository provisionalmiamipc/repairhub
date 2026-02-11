import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DevicesService } from '../../shared/services/devices.service';
import { Devices } from '../../shared/models/Devices';
import { DevicesDetailComponent } from './devices-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-devices-detail-page',
  standalone: true,
  imports: [CommonModule, DevicesDetailComponent],
  template: `
    <h1>Detalle de Dispositivo</h1>
    <app-devices-detail [device]="device"></app-devices-detail>
    <button (click)="goBack()">Back</button>
    <button (click)="onEdit()">Editar</button>
  `,
})
export class DevicesDetailPageComponent {
  device: Devices | null = null;

  constructor(
    private service: DevicesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(d => (this.device = d));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.device) {
      this.router.navigate(['../', this.device.id, 'edit'], { relativeTo: this.route });
    }
  }
}
