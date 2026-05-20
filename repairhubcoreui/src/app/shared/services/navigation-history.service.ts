import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private readonly currentUrlKey = 'repairhub_current_url';
  private readonly previousUrlKey = 'repairhub_previous_url';
  private readonly router = inject(Router);

  startTracking(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.record(event.urlAfterRedirects || event.url));
  }

  goBackOrDefault(defaultUrl: string): void {
    const previousUrl = this.getPreviousUrl();
    const currentUrl = this.router.url;

    if (previousUrl && previousUrl !== currentUrl) {
      this.router.navigateByUrl(previousUrl);
      return;
    }

    this.router.navigateByUrl(defaultUrl);
  }

  private record(url: string): void {
    if (this.isIgnoredUrl(url)) {
      return;
    }

    const currentUrl = sessionStorage.getItem(this.currentUrlKey);
    if (currentUrl && currentUrl !== url && !this.isIgnoredUrl(currentUrl)) {
      sessionStorage.setItem(this.previousUrlKey, currentUrl);
    }

    sessionStorage.setItem(this.currentUrlKey, url);
  }

  private getPreviousUrl(): string | null {
    const previousUrl = sessionStorage.getItem(this.previousUrlKey);
    return previousUrl && !this.isIgnoredUrl(previousUrl) ? previousUrl : null;
  }

  private isIgnoredUrl(url: string | null | undefined): boolean {
    if (!url) {
      return true;
    }

    return url.startsWith('/login') || url.startsWith('/verify-pin') || url.startsWith('/activate');
  }
}
