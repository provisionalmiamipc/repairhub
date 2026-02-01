import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleItemsService } from '../../shared/services/sale-items.service';
import { SaleItems } from '../../shared/models/SaleItems';
import { SaleItemsFormComponent } from './sale-items-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-items-edit-page',
  standalone: true,
  imports: [CommonModule, SaleItemsFormComponent],
  template: `
    <h1 *ngIf="!isNew">Editar Item</h1>
    <h1 *ngIf="isNew">Nuevo Item</h1>
    <app-sale-items-form
      [saleItem]="saleItem"
      (save)="onSave($event)"
    ></app-sale-items-form>
  `,
})
export class SaleItemsEditPageComponent {
  saleItem: SaleItems | null = null;
  isNew = false;

  constructor(
    private service: SaleItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(o => (this.saleItem = o));
    }
  }

  onSave(data: Partial<SaleItems>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.saleItem) {
      this.service.update(this.saleItem.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
