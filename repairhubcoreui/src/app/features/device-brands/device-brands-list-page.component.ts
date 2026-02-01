import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { DeviceBrandsListComponent } from './device-brands-list.component';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-device-brands-list-page',
  standalone: true,
  imports: [CommonModule, DeviceBrandsListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8"><h1 class="h2">Marcas de Dispositivos</h1></div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> Nueva Marca
          </button>
        </div>
      </div>
      <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}<button type="button" class="btn-close" (click)="clearError()"></button>
      </div>
      <div *ngIf="loading$ | async" class="text-center py-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
      </div>
      <app-device-brands-list *ngIf="!(loading$ | async)" [items]="items$" 
        (selectDeviceBrand)="onSelect($event)" (editDeviceBrand)="onEdit($event)" 
        (deleteDeviceBrand)="onDelete($event)">
      </app-device-brands-list>
    </div>
  `,
})
export class DeviceBrandsListPageComponent implements OnInit, OnDestroy {
  items$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;
  private destroy$ = new Subject<void>();

  constructor(private service: DeviceBrandsService, private router: Router) {}

  ngOnInit(): void { this.service.getAll(); }
  onCreate(): void { this.router.navigate(['/device-brands', 'new']); }
  onSelect(item: DeviceBrands): void { this.router.navigate(['/device-brands', item.id]); }
  onEdit(item: DeviceBrands): void { this.router.navigate(['/device-brands', item.id, 'edit']); }
  onDelete(item: DeviceBrands): void {
    if (confirm('¿Eliminar?')) {
      this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.service.getAll());
    }
  }
  clearError(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
