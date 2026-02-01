import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ItemsService } from '../../shared/services/items.service';
import { Items } from '../../shared/models/Items';
import { ItemsListComponent } from './items-list.component';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-items-list-page',
  standalone: true,
  imports: [CommonModule, ItemsListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8"><h1 class="h2">Items</h1></div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> Nuevo Item
          </button>
        </div>
      </div>
      <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}<button type="button" class="btn-close" (click)="clearError()"></button>
      </div>
      <div *ngIf="loading$ | async" class="text-center py-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
      </div>
      <app-items-list *ngIf="!(loading$ | async)" [items]="items$" 
        (selectItems)="onSelect($event)" (editItems)="onEdit($event)" 
        (deleteItems)="onDelete($event)">
      </app-items-list>
    </div>
  `,
})
export class ItemsListPageComponent implements OnInit, OnDestroy {
  items$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;
  private destroy$ = new Subject<void>();

  constructor(private service: ItemsService, private router: Router) {}

  ngOnInit(): void { this.service.getAll(); }
  onCreate(): void { this.router.navigate(['/items', 'new']); }
  onSelect(item: Items): void { this.router.navigate(['/items', item.id]); }
  onEdit(item: Items): void { this.router.navigate(['/items', item.id, 'edit']); }
  onDelete(item: Items): void {
    if (confirm('¿Eliminar?')) {
      this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.service.getAll());
    }
  }
  clearError(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
