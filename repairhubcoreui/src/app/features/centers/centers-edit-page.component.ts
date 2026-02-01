import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentersService } from '../../shared/services/centers.service';
import { Centers } from '../../shared/models/Centers';
import { CentersFormComponent } from './centers-form.component';
import { CommonModule } from '@angular/common';
import {
  CardBodyComponent,
  CardComponent,
  ColComponent,
  CardHeaderComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-centers-edit-page',
  standalone: true,
  imports: [CommonModule, CentersFormComponent, 
    CardComponent,    
    CardBodyComponent,
    ColComponent,
    CardHeaderComponent],
  template: `
    
    <c-col xs="12" class="col-12" data-bs-theme="dark">
    <c-card class="card mb-4">
      <c-card-header class="card-header">
          <strong *ngIf="!isNew">Edit Center</strong>
          <strong *ngIf="isNew">New Center</strong>
      </c-card-header>
      <c-card-body class="card-body">
        
    <app-centers-form
      [center]="center"
      (save)="onSave($event)"
      
    ></app-centers-form>
      </c-card-body></c-card></c-col>
  `,
})
export class CentersEditPageComponent {
  center: Centers | null = null;
  isNew = false;

  constructor(
    private service: CentersService,
    private router: Router,
    private route: ActivatedRoute,
    
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(c => (this.center = c));
    }
    console.log('🔍 center:', this.center);
  }

  onSave(data: Partial<Centers>) {
    console.log('🔍 onSave ejecutado con:', data);
    console.log('🔍 isNew:', this.isNew);
    console.log('🔍 center:', this.center);
    console.log('🔍 service:', this.service);
    console.log('🔍 router:', this.router);
    console.log('🔍 route:', this.route);

    if (!this.service) {
      console.error('❌ Service no disponible');
      return;
    }

    if (this.isNew) {
      console.log('🔄 Creando nuevo center...', data.completion?.toDateString);
      this.service.create(data).subscribe({
        next: () => {
          console.log('✅ Center creado exitosamente, fecha enviada:', data.completion);
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: (error) => {
          console.error('❌ Error creando center:', error);
        }
      });
    } else if (this.center) {
      console.log('🔄 Actualizando center...');
      this.service.update(this.center.id, data).subscribe({
        next: () => {
          console.log('✅ Center actualizado exitosamente');
          this.router.navigate(['../../'], { relativeTo: this.route });
        },
        error: (error) => {
          console.error('❌ Error actualizando center:', error);
        }
      });
    } else {
      console.error('❌ Ni es nuevo ni hay center existente');
    }
    /*if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.center) {
      this.service.update(this.center.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }*/
  }
  
}
