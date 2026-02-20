import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairStatusService } from '../../shared/services/repair-status.service';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { RepairStatusFormComponent } from './repair-status-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repair-status-edit-page',
  standalone: true,
  imports: [CommonModule, RepairStatusFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Status</h1>
    <h1 *ngIf="isNew">New Status</h1>
    <app-repair-status-form
      [repairStatus]="repairStatus"
      (save)="onSave($event)"
    ></app-repair-status-form>
  `,
})
export class RepairStatusEditPageComponent {
  repairStatus: RepairStatus | null = null;
  isNew = false;

  constructor(
    private service: RepairStatusService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(r => (this.repairStatus = r));
    }
  }

  onSave(data: Partial<RepairStatus>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.repairStatus) {
      this.service.update(this.repairStatus.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
