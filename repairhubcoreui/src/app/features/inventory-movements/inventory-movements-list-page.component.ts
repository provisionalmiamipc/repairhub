import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InventoryMovementsService } from '../../shared/services/inventory-movements.service';
import { InventoryMovements } from '../../shared/models/InventoryMovements';
import { InventoryMovementsListComponent } from './inventory-movements-list.component';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-movements-list-page',
  standalone: true,
  imports: [CommonModule, InventoryMovementsListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Movimientos de Inventario</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> New Movement
          </button>
        </div>
      </div>

      <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" (click)="clearError()"></button>
      </div>

      <div *ngIf="loading$ | async">
        <div class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>

      <app-inventory-movements-list
        *ngIf="!(loading$ | async)"
        [items]="movements$"
        (selectMovement)="onSelect($event)"
        (editMovement)="onEdit($event)"
        (deleteMovement)="onDelete($event)">
      </app-inventory-movements-list>
    </div>
  `,
})
export class InventoryMovementsListPageComponent implements OnInit, OnDestroy {
  movements$: Observable<InventoryMovements[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(
    private inventoryMovementsService: InventoryMovementsService,
    private router: Router
  ) {
    this.movements$ = this.inventoryMovementsService.data$;
    this.loading$ = this.inventoryMovementsService.loading$;
    this.error$ = this.inventoryMovementsService.error$;
  }

  ngOnInit(): void {
    this.inventoryMovementsService.getAll();
  }

  onCreate(): void {
    this.router.navigate(['/inventory-movements', 'new']);
  }

  onSelect(movement: InventoryMovements): void {
    this.router.navigate(['/inventory-movements', movement.id]);
  }

  onEdit(movement: InventoryMovements): void {
    this.router.navigate(['/inventory-movements', movement.id, 'edit']);
  }

  onDelete(movement: InventoryMovements): void {
    if (confirm(`Delete movement ${movement.id}?`)) {
      this.inventoryMovementsService
        .delete(movement.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.inventoryMovementsService.getAll();
        });
    }
  }

  clearError(): void {
    // Could implement error clearing logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
