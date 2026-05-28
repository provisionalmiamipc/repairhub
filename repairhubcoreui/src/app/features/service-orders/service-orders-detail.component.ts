import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { ServiceOrderImage, ServiceOrders } from '../../shared/models/ServiceOrders';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MediaService } from '../../shared/services/media.service';
import { finalize } from 'rxjs/operators';
import { Warranty } from '../../shared/models/Warranty';
import { WarrantiesService } from '../../shared/services/warranties.service';
import { ToastService } from '../../shared/services/toast.service';
import { InvoicesService } from '../../shared/services/invoices.service';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';


@Component({
  selector: 'app-service-orders-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-orders-detail.component.html',
})
export class ServiceOrdersDetailComponent implements OnChanges {
  @Input() serviceOrder: ServiceOrders | null = null;
  @Output() back = new EventEmitter();
  @Output() edit = new EventEmitter(); 
  readonly imageFallbackUrl = 'assets/images/no-image-icon-23483.png';
  selectedImage: ServiceOrderImage | null = null;
  selectedImageDisplayUrl = this.imageFallbackUrl;
  isLoadingDisplayImage = false;

  public authService = inject(AuthService);
  private mediaService = inject(MediaService);
  private warrantiesService = inject(WarrantiesService);
  private invoicesService = inject(InvoicesService);
  private serviceOrdersService = inject(ServiceOrdersService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  warranties: Warranty[] = [];
  isWarrantyLoading = false;
  isWarrantySaving = false;
  isWarrantyOrderSaving = false;
  isInvoiceSaving = false;
  isPdfSaving = false;

  // trackBy helper for ngFor
  trackById(index: number, item: any) {
    return item?.id ?? index;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceOrder'] && this.serviceOrder?.id) {
      this.warranties = this.serviceOrder.warranties ?? [];
      this.loadWarranties();
    }
  }

  get activeWarranty(): Warranty | null {
    return this.warranties.find(warranty => warranty.status === 'active') ?? null;
  }

  get latestWarranty(): Warranty | null {
    return this.warranties[0] ?? null;
  }

  get canCreateWarranty(): boolean {
    return !!this.serviceOrder?.cloused &&
      !this.serviceOrder?.canceled &&
      Number(this.serviceOrder?.warrantyDuration ?? 0) > 0 &&
      !this.activeWarranty;
  }

  get canCreateWarrantyOrder(): boolean {
    return !!this.activeWarranty && !this.serviceOrder?.isWarrantyOrder;
  }

  get warrantyPeriodLabel(): string {
    const duration = this.serviceOrder?.warrantyDuration ?? 6;
    const unit = this.serviceOrder?.warrantyDurationUnit ?? 'months';
    return `${duration} ${unit}`;
  }

  loadWarranties(): void {
    if (!this.serviceOrder?.id) return;
    this.isWarrantyLoading = true;
    this.warrantiesService.getByServiceOrder(this.serviceOrder.id).pipe(
      finalize(() => this.isWarrantyLoading = false)
    ).subscribe({
      next: warranties => this.warranties = warranties ?? [],
      error: () => this.toastService.error('Error loading warranty'),
    });
  }

  createWarranty(): void {
    if (!this.serviceOrder?.id) return;
    this.isWarrantySaving = true;
    const createdById = this.authService.getEmployeeId?.() ?? this.serviceOrder.createdById ?? null;
    this.warrantiesService.createFromServiceOrder(this.serviceOrder.id, createdById).pipe(
      finalize(() => this.isWarrantySaving = false)
    ).subscribe({
      next: warranty => {
        this.warranties = [warranty, ...this.warranties];
        this.toastService.success('Warranty created');
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Error creating warranty'),
    });
  }

  voidWarranty(warranty: Warranty): void {
    const reason = window.prompt('Void reason');
    if (!reason?.trim()) return;
    this.isWarrantySaving = true;
    const voidedById = this.authService.getEmployeeId?.() ?? null;
    this.warrantiesService.voidWarranty(warranty.id, {
      warrantyVoidReason: reason.trim(),
      voidedById,
    }).pipe(
      finalize(() => this.isWarrantySaving = false)
    ).subscribe({
      next: updated => {
        this.warranties = this.warranties.map(item => item.id === updated.id ? updated : item);
        this.toastService.success('Warranty voided');
      },
      error: () => this.toastService.error('Error voiding warranty'),
    });
  }

  createWarrantyOrder(warranty: Warranty): void {
    if (!this.serviceOrder?.id) return;
    this.isWarrantyOrderSaving = true;
    const createdById = this.authService.getEmployeeId?.() ?? this.serviceOrder.createdById ?? null;
    this.warrantiesService.createWarrantyOrder(warranty.id, {
      assignedTechId: this.serviceOrder.assignedTechId,
      createdById,
    }).pipe(
      finalize(() => this.isWarrantyOrderSaving = false)
    ).subscribe({
      next: order => {
        this.toastService.success('Warranty service order created');
        this.router.navigate(['/service-orders', order.id, 'edit']);
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Error creating warranty order'),
    });
  }

  createInvoice(): void {
    if (!this.serviceOrder?.id) return;
    this.isInvoiceSaving = true;
    const createdById = this.authService.getEmployeeId?.() ?? this.serviceOrder.createdById ?? null;
    this.invoicesService.createFromServiceOrder(this.serviceOrder.id, createdById).pipe(
      finalize(() => this.isInvoiceSaving = false)
    ).subscribe({
      next: invoice => {
        this.toastService.success('Invoice draft created');
        this.router.navigate(['/invoices', invoice.id, 'edit']);
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Error creating invoice'),
    });
  }

  openPdf(): void {
    if (!this.serviceOrder?.id) return;
    this.isPdfSaving = true;
    this.serviceOrdersService.downloadPdf(this.serviceOrder.id).pipe(
      finalize(() => this.isPdfSaving = false)
    ).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
      error: err => this.toastService.error(err?.error?.message || 'Error opening service order PDF'),
    });
  }

  get visibleImages(): ServiceOrderImage[] {
    return (this.serviceOrder?.images ?? []).filter(image => image.status !== 'deleted');
  }

  getImageThumbUrl(image: ServiceOrderImage): string {
    return image.status === 'ready' && image.thumbnailUrl
      ? image.thumbnailUrl
      : this.imageFallbackUrl;
  }

  getImageDisplayUrl(image: ServiceOrderImage | null): string {
    return image ? this.selectedImageDisplayUrl : this.imageFallbackUrl;
  }

  openImage(image: ServiceOrderImage): void {
    this.selectedImage = image;
    this.selectedImageDisplayUrl = this.imageFallbackUrl;

    if (image.status !== 'ready') return;

    this.isLoadingDisplayImage = true;
    this.mediaService.getVariantUrl(image.id, 'display').pipe(
      finalize(() => {
        this.isLoadingDisplayImage = false;
      })
    ).subscribe({
      next: response => {
        this.selectedImageDisplayUrl = response.url || this.imageFallbackUrl;
      },
      error: () => {
        this.selectedImageDisplayUrl = this.imageFallbackUrl;
      },
    });
  }

  closeImage(): void {
    this.selectedImage = null;
    this.selectedImageDisplayUrl = this.imageFallbackUrl;
    this.isLoadingDisplayImage = false;
  }

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.imageFallbackUrl)) {
      image.src = this.imageFallbackUrl;
    }
  }
}
