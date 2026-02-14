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
    // center cargado (logs removidos)
  }

  onSave(data: Partial<Centers>) {
    // onSave ejecutado (logs removidos)

    if (!this.service) {
      return;
    }

    if (this.isNew) {
      this.service.create(data).subscribe({
        next: () => {
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: () => {
          // manejar error (logs removidos)
        }
      });
    } else if (this.center) {
      this.service.update(this.center.id, data).subscribe({
        next: () => {
          this.router.navigate(['../../'], { relativeTo: this.route });
        },
        error: () => {
          // manejar error (logs removidos)
        }
      });
    } else {
      // Ni es nuevo ni hay center existente
    }
    /*if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.center) {
      this.service.update(this.center.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }*/
  }
  
}
