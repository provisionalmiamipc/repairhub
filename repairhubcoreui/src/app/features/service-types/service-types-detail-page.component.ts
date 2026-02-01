import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { ServiceTypesDetailComponent } from './service-types-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-types-detail-page',
  standalone: true,
  imports: [CommonModule, ServiceTypesDetailComponent],
  template: `
    
    <app-service-types-detail [serviceType]="serviceType"></app-service-types-detail>
    
  `,
})
export class ServiceTypesDetailPageComponent {
  serviceType: ServiceTypes | null = null;

  constructor(
    private service: ServiceTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(t => (this.serviceType = t));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.serviceType) {
      this.router.navigate(['../', this.serviceType.id, 'edit'], { relativeTo: this.route });
    }
  }
}
