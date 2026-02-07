import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemsService } from '../../shared/services/items.service';
import { Items } from '../../shared/models/Items';
import { ItemsDetailComponent } from './items-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-items-detail-page',
  standalone: true,
  imports: [CommonModule, ItemsDetailComponent],
 template: `
    <h1>Item Detail</h1>
    <app-items-detail [item]="item" (edit)="onEdit()" (view)="goBack()"></app-items-detail>
    
  `,
})
export class ItemsDetailPageComponent {
  item: Items | null = null;

  constructor(
    private service: ItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(i => (this.item = i));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.item) {
      this.router.navigate(['../', this.item.id, 'edit'], { relativeTo: this.route });
    }
  }
}
