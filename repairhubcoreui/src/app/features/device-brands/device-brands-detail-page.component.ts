import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { DeviceBrandsDetailComponent } from './device-brands-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-device-brands-detail-page',
  standalone: true,
  imports: [CommonModule, DeviceBrandsDetailComponent],
  template: `
    
    <app-device-brands-detail [deviceBrand]="deviceBrand"></app-device-brands-detail>
    
  `,
})
export class DeviceBrandsDetailPageComponent {
  deviceBrand: DeviceBrands | null = null;

  constructor(
    private service: DeviceBrandsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(b => (this.deviceBrand = b));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.deviceBrand) {
      this.router.navigate(['../', this.deviceBrand.id, 'edit'], { relativeTo: this.route });
    }
  }
}
