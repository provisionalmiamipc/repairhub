import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemsService } from '../../shared/services/items.service';
import { Items } from '../../shared/models/Items';
import { ItemsFormComponent } from './items-form.component';

@Component({
  selector: 'app-items-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemsFormComponent],
  templateUrl: './items-search.component.html',
})
export class ItemsSearchComponent {
  @Input() isModal: boolean = false;
  @Output() select = new EventEmitter<Items>();
  @Output() cancel = new EventEmitter<void>();

  items: Items[] = [];
  filtered: Items[] = [];
  search = '';
  isLoading = false;
  showCreateModal = false;

  constructor(private itemsService: ItemsService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.isLoading = true;
    this.itemsService.getAll().subscribe({
      next: (items) => {
        this.items = items || [];
        this.filtered = this.items;
        this.isLoading = false;
      },
      error: () => {
        this.items = [];
        this.filtered = [];
        this.isLoading = false;
      }
    });
  }

  onSearchChange() {
    const q = (this.search || '').toString().trim().toLowerCase();
    if (!q) {
      this.filtered = this.items;
      return;
    }

    this.filtered = this.items.filter(i => {
      const text = `${i.product || ''} ${i.sku || ''} ${i.shortTitleDesc || ''} ${i.barcode || ''}`.toLowerCase();
      return text.indexOf(q) !== -1;
    });
  }

  onSelect(item: Items) {
    this.select.emit(item);
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  onCreateItem(created: Partial<Items>) {
    this.closeCreateModal();
    this.loadAll();
    this.onSelect(created as Items);
  }

  onCancel() {
    this.cancel.emit();
  }
}
