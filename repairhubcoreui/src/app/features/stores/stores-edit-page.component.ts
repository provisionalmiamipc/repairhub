import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoresService } from '../../shared/services/stores.service';
import { Stores } from '../../shared/models/Stores';
import { StoresFormComponent } from './stores-form.component';
import { CommonModule } from '@angular/common';
import {
  CardBodyComponent,
  CardComponent,
  ColComponent,
  CardHeaderComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-stores-edit-page',
  standalone: true,
  imports: [CommonModule, StoresFormComponent, CardComponent,    
    CardBodyComponent,
    ColComponent,
    CardHeaderComponent],
  template: `
        
    <c-col xs="12" _nghost-ng-c2955351752="" class="col-12">
    <c-card class="card mb-4">
      <c-card-header class="card-header">
        <h6 *ngIf="!isNew">Edit Store</h6>
        <h6 *ngIf="isNew">New Store</h6>
      </c-card-header>
      <c-card-body class="card-body">
        <app-stores-form
      [store]="store"
      (save)="onSave($event)"
    ></app-stores-form>
      </c-card-body>      
    </c-card>
  </c-col>
  `,
})
export class StoresEditPageComponent {
  store: Stores | null = null;
  isNew = false;

  constructor(
    private service: StoresService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(s => (this.store = s));
    }
  }

  onSave(data: Partial<Stores>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.store) {
      this.service.update(this.store.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
