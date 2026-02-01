import { Component, Input, inject } from '@angular/core';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-types-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-types-detail.component.html',
  styleUrls: ['./service-types-detail.component.scss']
})
export class ServiceTypesDetailComponent {
  @Input() serviceType: ServiceTypes | null = null;
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/service-types']);
  }

  editServiceType(): void {
    if (this.serviceType) {
      this.router.navigate(['/service-types', this.serviceType.id, 'edit']);
    }
  }
}
