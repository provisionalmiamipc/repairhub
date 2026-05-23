import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ServiceOrderImage, ServiceOrders } from '../../shared/models/ServiceOrders';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { MediaService } from '../../shared/services/media.service';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-service-orders-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-orders-detail.component.html',
})
export class ServiceOrdersDetailComponent {
  @Input() serviceOrder: ServiceOrders | null = null;
  @Output() back = new EventEmitter();
  @Output() edit = new EventEmitter(); 
  readonly imageFallbackUrl = 'assets/images/no-image-icon-23483.png';
  selectedImage: ServiceOrderImage | null = null;
  selectedImageDisplayUrl = this.imageFallbackUrl;
  isLoadingDisplayImage = false;

  public authService = inject(AuthService);
  private mediaService = inject(MediaService);

  // trackBy helper for ngFor
  trackById(index: number, item: any) {
    return item?.id ?? index;
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
