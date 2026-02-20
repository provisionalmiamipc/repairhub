import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesService } from '../../shared/services/sales.service';
import { Sales } from '../../shared/models/Sales';
import { SalesFormComponent } from './sales-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-edit-page',
  standalone: true,
  imports: [CommonModule, SalesFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Sale</h1>
    <h1 *ngIf="isNew">New Sale</h1>
    <app-sales-form
      [sale]="sale"
      (save)="onSave($event)"
    ></app-sales-form>
  `,
})
export class SalesEditPageComponent {
  sale: Sales | null = null;
  isNew = false;

  constructor(
    private service: SalesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(s => (this.sale = s));
    }
  }

  onSave(data: Partial<Sales>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.sale) {
      this.service.update(this.sale.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
