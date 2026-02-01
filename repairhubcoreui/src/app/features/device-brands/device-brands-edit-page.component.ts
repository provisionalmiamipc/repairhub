import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { DeviceBrandsFormComponent } from './device-brands-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-device-brands-edit-page',
  standalone: true,
  imports: [CommonModule, DeviceBrandsFormComponent],
  template: `
    
    <app-device-brands-form
      [deviceBrand]="deviceBrand"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-device-brands-form>
  `,
})
export class DeviceBrandsEditPageComponent {
  deviceBrand: DeviceBrands | null = null;
  isNew = false;

  constructor(
    private service: DeviceBrandsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(b => (this.deviceBrand = b));
    }
  }

  onSave(data: Partial<DeviceBrands>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.deviceBrand) {
      this.service.update(this.deviceBrand.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
  onCancel(): void {
    this.router.navigate(['/device-brands']);
  }
}
