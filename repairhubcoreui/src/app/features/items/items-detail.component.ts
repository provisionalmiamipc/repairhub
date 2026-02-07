import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Items } from '../../shared/models/Items';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-items-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './items-detail.component.html',
})
export class ItemsDetailComponent {
  @Input() item: Items | null = null;
  @Output() view = new EventEmitter<Items | null>();
  @Output() edit = new EventEmitter<Items | null>();

  viewItem(item: Items | null) {
    this.view.emit(item);
  }

  editItem(item: Items | null) {
    this.edit.emit(item);
  }

  public authService = inject(AuthService);

  goBack() {
    try {
      history.back();
    } catch (e) {
      // fallback: emit view event with null so parent can handle navigation
      this.view.emit(null);
    }
  }

  // Helpers used by the template (safe fallbacks when relations are not provided)
  getItemCenterId(item: Items | null): number | null {
    if (!item) return null;
    const v = (item as any).centerId ?? (item as any).centerid ?? (item as any).center?.id ?? null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  getItemStoreId(item: Items | null): number | null {
    if (!item) return null;
    const v = (item as any).storeId ?? (item as any).storeid ?? (item as any).store?.id ?? null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  getCenterName(centerId: number | null | undefined): string {
    // If the item includes nested center object, prefer it
    if (this.item && (this.item as any).center && (this.item as any).center.id === centerId) {
      return (this.item as any).center.centerName || 'N/A';
    }
    return 'N/A';
  }

  getStoreName(storeId: number | null | undefined): string {
    if (this.item && (this.item as any).store && (this.item as any).store.id === storeId) {
      return (this.item as any).store.storeName || 'N/A';
    }
    return 'N/A';
  }

  getTypeName(typeId: number | null | undefined): string {
    if (this.item && (this.item as any).itemType && (this.item as any).itemType.id === typeId) {
      return (this.item as any).itemType.name || 'N/A';
    }
    return 'N/A';
  }

  getPriceMargin(item: Items | null): number {
    if (!item) return 0;
    const cost = Number((item as any).cost) || 0;
    const price = Number((item as any).price) || 0;
    if (cost <= 0) return 0;
    return ((price - cost) / cost) * 100;
  }

  formatCurrency(value: number | null | undefined): string {
    const v = Number(value) || 0;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
  }
}
