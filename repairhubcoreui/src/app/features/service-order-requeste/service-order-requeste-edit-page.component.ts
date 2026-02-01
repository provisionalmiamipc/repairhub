import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceOrderRequesteService } from '../../shared/services/service-order-requeste.service';
import { ServiceOrderRequeste } from '../../shared/models/ServiceOrderRequeste';
import { ServiceOrderRequesteFormComponent } from './service-order-requeste-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-order-requeste-edit-page',
  standalone: true,
  imports: [CommonModule, ServiceOrderRequesteFormComponent],
  template: `
    <h1 *ngIf="!isNew">Editar Solicitud</h1>
    <h1 *ngIf="isNew">Nueva Solicitud</h1>
    <app-service-order-requeste-form
      [request]="request"
      (save)="onSave($event)"
    ></app-service-order-requeste-form>
  `,
})
export class ServiceOrderRequesteEditPageComponent {
  request: ServiceOrderRequeste | null = null;
  isNew = false;

  constructor(
    private service: ServiceOrderRequesteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(r => (this.request = r));
    }
  }

  onSave(data: Partial<ServiceOrderRequeste>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.request) {
      this.service.update(this.request.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
