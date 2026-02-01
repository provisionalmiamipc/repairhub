import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StoresService } from '../../shared/services/stores.service';
import { Stores } from '../../shared/models/Stores';
import { StoresListComponent } from './stores-list.component';
import { CommonModule } from '@angular/common';
import { ColComponent, CardComponent, CardBodyComponent, CardHeaderComponent, RowComponent } from '@coreui/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-stores-list-page',
  standalone: true,
  imports: [CommonModule, StoresListComponent, ColComponent, CardComponent, CardBodyComponent, CardHeaderComponent, RowComponent],
  template: `
    <c-col xs="12" class="col-12">
    <c-card class="card mb-4">
      <c-card-header class="card-header">
        <c-row class="row">
          <c-col class="col">
            <h5 ccardtitle="" class="card-title fs-4 fw-semibold">Stores</h5>
          </c-col>
          <c-col class="ms-auto col-auto col">
            <button cbutton="" color="primary" type="button" class="btn btn-primary" (click)="onCreate()">
              <i class="cil-plus me-2"></i> New Store </button>
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
        <app-stores-list *ngIf="!(loading$ | async)" [items]="items$" 
          (selectStores)="onSelect($event)" (editStores)="onEdit($event)" 
          (deleteStores)="onDelete($event)"></app-stores-list>
      </c-card-body>
    </c-card>
  </c-col>
  `,
})
export class StoresListPageComponent implements OnInit, OnDestroy {
  items$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;
  private destroy$ = new Subject<void>();

  constructor(private service: StoresService, private router: Router) {}

  ngOnInit(): void { this.service.getAll(); }
  onCreate(): void { this.router.navigate(['/stores', 'new']); }
  onSelect(item: Stores): void { this.router.navigate(['/stores', item.id]); }
  onEdit(item: Stores): void { this.router.navigate(['/stores', item.id, 'edit']); }
  onDelete(item: Stores): void {
    if (confirm('¿Eliminar?')) {
      this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.service.getAll());
    }
  }
  clearError(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }}