import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { ServiceTypesListComponent } from './service-types-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-types-list-page',
  standalone: true,
  imports: [CommonModule, ServiceTypesListComponent],
  template: `
    
    <app-service-types-list
      [serviceTypes]="serviceTypes"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
      (new)="onCreate()"
    ></app-service-types-list>
  `,
})
export class ServiceTypesListPageComponent {
  serviceTypes: ServiceTypes[] = [];

  constructor(
    private service: ServiceTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(serviceTypes => (this.serviceTypes = serviceTypes));
  }

  onSelect(serviceType: ServiceTypes) {
    this.router.navigate(['./', serviceType.id], { relativeTo: this.route });
  }

  onEdit(serviceType: ServiceTypes) {
    this.router.navigate(['./', serviceType.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(serviceType: ServiceTypes) {
    if (confirm('Delete this type?')) {
      this.service.delete(serviceType.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
