import { Component, Input, inject } from '@angular/core';
import { Devices } from '../../shared/models/Devices';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-devices-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices-detail.component.html',
  styleUrls: ['./devices-detail.component.scss']
})
export class DevicesDetailComponent {
  @Input() device: Devices | null = null;
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  editDevice(): void {
    if (this.device) {
      this.router.navigate(['/devices', this.device.id, 'edit']);
    }
  }
}
