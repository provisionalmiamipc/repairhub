import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairStatusService } from '../../shared/services/repair-status.service';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { RepairStatusDetailComponent } from './repair-status-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repair-status-detail-page',
  standalone: true,
  imports: [CommonModule, RepairStatusDetailComponent],
  template: `
    <h1>Detalle de Estado de Reparación</h1>
    <app-repair-status-detail [repairStatus]="repairStatus"></app-repair-status-detail>
    <button (click)="goBack()">Back</button>
    <button (click)="onEdit()">Edit</button>
  `,
})
export class RepairStatusDetailPageComponent {
  repairStatus: RepairStatus | null = null;

  constructor(
    private service: RepairStatusService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(r => (this.repairStatus = r));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.repairStatus) {
      this.router.navigate(['../', this.repairStatus.id, 'edit'], { relativeTo: this.route });
    }
  }
}
