import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CentersService } from '../../shared/services/centers.service';
import { Centers } from '../../shared/models/Centers';
import { CentersListComponent } from './centers-list.component';
import { CommonModule } from '@angular/common';
import { CardBodyComponent, CardComponent, ColComponent, RowComponent, CardHeaderComponent } from '@coreui/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-centers-list-page',
  standalone: true,
  imports: [CommonModule, CentersListComponent, CardBodyComponent, CardComponent, RowComponent, ColComponent, CardHeaderComponent],
  template: `      
    <c-col xs="12" class="col-12">
    <c-card class="card mb-4">
      <c-card-header class="card-header">        
        <c-row class="row">
          <c-col class="col">
            <h5 ccardtitle="" class="card-title fs-4 fw-semibold">Centers</h5>
          </c-col>
          <c-col class="ms-auto col-auto col">
            <button cbutton="" color="primary" type="button" class="btn btn-primary" (click)="onCreate()">
              <i class="cil-plus me-2"></i> New Center </button>
            </c-col>
          </c-row>
      </c-card-header>
      <c-card-body class="card-body">
        <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show" role="alert">
          {{ error }}<button type="button" class="btn-close" (click)="clearError()"></button>
        </div>
        <div *ngIf="loading$ | async" class="text-center py-5">
          <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
        <app-centers-list *ngIf="!(loading$ | async)" [items]="items$"
          (selectCenters)="onSelect($event)" (editCenters)="onEdit($event)" 
          (deleteCenters)="onDelete($event)"></app-centers-list>
      </c-card-body>
    </c-card>
  </c-col>
  `,
})
export class CentersListPageComponent implements OnInit, OnDestroy {
  items$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;
  private destroy$ = new Subject<void>();

  constructor(private service: CentersService, private router: Router) {}

  ngOnInit(): void { this.service.getAll(); }
  onCreate(): void { this.router.navigate(['/centers', 'new']); }
  onSelect(item: Centers): void { this.router.navigate(['/centers', item.id]); }
  onEdit(item: Centers): void { this.router.navigate(['/centers', item.id, 'edit']); }
  onDelete(item: Centers): void {
    if (confirm('¿Eliminar?')) {
      this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.service.getAll());
    }
  }
  clearError(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }}