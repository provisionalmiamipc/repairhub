import { Component, Input, inject } from '@angular/core';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-device-brands-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-brands-detail.component.html',
  styleUrls: ['./device-brands-detail.component.scss']
})
export class DeviceBrandsDetailComponent {
  @Input() deviceBrand: DeviceBrands | null = null;
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/device-brands']);
  }

  editDeviceBrand(): void {
    if (this.deviceBrand) {
      this.router.navigate(['/device-brands', this.deviceBrand.id, 'edit']);
    }
  }
}
