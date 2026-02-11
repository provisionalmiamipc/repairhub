import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RepairStatusService } from '../../shared/services/repair-status.service';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { RepairStatusListComponent } from './repair-status-list.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-repair-status-list-page',
  standalone: true,
  imports: [CommonModule, RepairStatusListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Repair Statuses</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> New Status
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

      <app-repair-status-list
        *ngIf="!(loading$ | async)"
        [items]="repairStatuses$"
        (selectRepairStatus)="onSelect($event)"
        (editRepairStatus)="onEdit($event)"
        (deleteRepairStatus)="onDelete($event)">
      </app-repair-status-list>
    </div>
  `,
})
export class RepairStatusListPageComponent implements OnInit, OnDestroy {
  repairStatuses$;
  loading$;
  error$;

  private destroy$ = new Subject<void>();

  constructor(
    private repairStatusService: RepairStatusService,
    private router: Router
  ) {
    this.repairStatuses$ = this.repairStatusService.data$;
    this.loading$ = this.repairStatusService.loading$;
    this.error$ = this.repairStatusService.error$;
  }

  ngOnInit(): void {
    this.repairStatusService.getAll();
  }

  onCreate(): void {
    this.router.navigate(['/repair-status', 'new']);
  }

  onSelect(repairStatus: RepairStatus): void {
    this.router.navigate(['/repair-status', repairStatus.id]);
  }

  onEdit(repairStatus: RepairStatus): void {
    this.router.navigate(['/repair-status', repairStatus.id, 'edit']);
  }

  onDelete(repairStatus: RepairStatus): void {
    if (confirm(`Delete status?`)) {
      this.repairStatusService
        .delete(repairStatus.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.repairStatusService.getAll();
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
