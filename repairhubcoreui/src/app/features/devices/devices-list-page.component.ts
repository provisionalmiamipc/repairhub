import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DevicesService } from '../../shared/services/devices.service';
import { Devices } from '../../shared/models/Devices';
import { DevicesListComponent } from './devices-list.component';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-devices-list-page',
  standalone: true,
  imports: [CommonModule, DevicesListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8"><h1 class="h2">Devices</h1></div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> New Device
          </button>
        </div>
      </div>
      <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}<button type="button" class="btn-close" (click)="clearError()"></button>
      </div>
        <div *ngIf="loading$ | async" class="text-center py-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
      </div>
      <app-devices-list *ngIf="!(loading$ | async)" [items]="items$" 
        (selectDevices)="onSelect($event)" (editDevices)="onEdit($event)" 
        (deleteDevices)="onDelete($event)">
      </app-devices-list>
    </div>
  `,
})
export class DevicesListPageComponent implements OnInit, OnDestroy {
  items$;
  loading$;
  error$;
  private destroy$ = new Subject<void>();

  constructor(private service: DevicesService, private router: Router) {
    this.items$ = this.service.data$;
    this.loading$ = this.service.loading$;
    this.error$ = this.service.error$;
  }

  ngOnInit(): void { this.service.getAll(); }
  onCreate(): void { this.router.navigate(['/devices', 'new']); }
  onSelect(item: Devices): void { this.router.navigate(['/devices', item.id]); }
  onEdit(item: Devices): void { this.router.navigate(['/devices', item.id, 'edit']); }
  onDelete(item: Devices): void {
    if (confirm('Delete device?')) {
      this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe(() => this.service.getAll());
    }
  }
  clearError(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
