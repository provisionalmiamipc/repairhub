import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceOrderRequesteService } from '../../shared/services/service-order-requeste.service';
import { ServiceOrderRequeste } from '../../shared/models/ServiceOrderRequeste';
import { ServiceOrderRequesteDetailComponent } from './service-order-requeste-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-order-requeste-detail-page',
  standalone: true,
  imports: [CommonModule, ServiceOrderRequesteDetailComponent],
  template: `
    <h1>Detalle de Solicitud</h1>
    <app-service-order-requeste-detail [request]="request"></app-service-order-requeste-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Editar</button>
  `,
})
export class ServiceOrderRequesteDetailPageComponent {
  request: ServiceOrderRequeste | null = null;

  constructor(
    private service: ServiceOrderRequesteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(r => (this.request = r));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.request) {
      this.router.navigate(['../', this.request.id, 'edit'], { relativeTo: this.route });
    }
  }
}
