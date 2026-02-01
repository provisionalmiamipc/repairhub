import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { ServiceTypesFormComponent } from './service-types-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-types-edit-page',
  standalone: true,
  imports: [CommonModule, ServiceTypesFormComponent],
  template: `
    <!--<h1 *ngIf="!isNew">Editar Tipo</h1>
    <h1 *ngIf="isNew">Nuevo Tipo</h1>-->
    <app-service-types-form
      [serviceType]="serviceType"
      (save)="onSave($event)"
      (cancel)="onCancel()"
    ></app-service-types-form>
  `,
})
export class ServiceTypesEditPageComponent {
  serviceType: ServiceTypes | null = null;
  isNew = false;

  constructor(
    private service: ServiceTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(t => (this.serviceType = t));
    }
  }

  onSave(_: Partial<ServiceTypes>) {
    this.router.navigate(['/service-types']);
  }
  onCancel(): void {
    this.router.navigate(['/service-types']);
  }
}
