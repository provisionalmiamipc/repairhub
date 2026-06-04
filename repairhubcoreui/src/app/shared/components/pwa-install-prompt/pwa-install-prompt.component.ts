import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallMode = 'browserPrompt' | 'iosSafari' | 'macSafari';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside
      *ngIf="isVisible()"
      class="pwa-install"
      role="region"
      aria-label="Install OceanSPT"
    >
      <div class="pwa-install__icon" aria-hidden="true">
        <i class="bi bi-phone"></i>
      </div>

      <div class="pwa-install__copy">
        <strong>{{ title() }}</strong>
        <span>{{ message() }}</span>
      </div>

      <div class="pwa-install__actions">
        <button
          *ngIf="installMode() === 'browserPrompt'"
          type="button"
          class="btn btn-sm btn-primary"
          (click)="install()"
        >
          Install
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          (click)="dismiss()"
        >
          {{ installMode() === 'browserPrompt' ? 'Later' : 'Got it' }}
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .pwa-install {
      position: fixed;
      right: max(1rem, env(safe-area-inset-right));
      bottom: max(1rem, env(safe-area-inset-bottom));
      z-index: 1080;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: .75rem;
      width: min(520px, calc(100vw - 2rem));
      padding: .85rem;
      border: 1px solid var(--cui-border-color, #d8dbe0);
      border-radius: .5rem;
      background: var(--cui-body-bg, #fff);
      color: var(--cui-body-color, #212529);
      box-shadow: 0 .75rem 2rem rgba(0, 0, 0, .16);
    }

    .pwa-install__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: .5rem;
      background: rgba(var(--cui-primary-rgb, 13, 110, 253), .12);
      color: var(--cui-primary, #0d6efd);
      font-size: 1.2rem;
    }

    .pwa-install__copy {
      display: grid;
      gap: .15rem;
      min-width: 0;
      font-size: .9rem;
      line-height: 1.25;
    }

    .pwa-install__copy span {
      color: var(--cui-secondary-color, #6c757d);
    }

    .pwa-install__actions {
      display: flex;
      gap: .5rem;
      align-items: center;
    }

    @media (max-width: 575.98px) {
      .pwa-install {
        left: max(.75rem, env(safe-area-inset-left));
        right: max(.75rem, env(safe-area-inset-right));
        bottom: max(.75rem, env(safe-area-inset-bottom));
        grid-template-columns: auto minmax(0, 1fr);
      }

      .pwa-install__actions {
        grid-column: 1 / -1;
        justify-content: flex-end;
      }
    }
  `]
})
export class PwaInstallPromptComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'oceanspt:pwa-install-dismissed';
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isVisible = signal(false);
  readonly installMode = signal<InstallMode>('browserPrompt');
  readonly title = signal('Install OceanSPT');
  readonly message = signal('Add OceanSPT to your device for quick access.');

  ngOnInit(): void {
    if (this.isInstalled() || this.wasDismissed()) return;

    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.handleAppInstalled);

    this.showTimer = setTimeout(() => this.showManualSafariPrompt(), 1600);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    if (this.showTimer) clearTimeout(this.showTimer);
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;

    const prompt = this.deferredPrompt;
    this.deferredPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === 'accepted') {
      this.rememberDismissed();
    }

    this.isVisible.set(false);
  }

  dismiss(): void {
    this.rememberDismissed();
    this.isVisible.set(false);
  }

  private readonly handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.installMode.set('browserPrompt');
    this.title.set('Install OceanSPT');
    this.message.set('Add OceanSPT to your desktop for quick access.');
    this.isVisible.set(true);
  };

  private readonly handleAppInstalled = () => {
    this.rememberDismissed();
    this.isVisible.set(false);
  };

  private showManualSafariPrompt(): void {
    if (this.deferredPrompt || this.isVisible() || this.isInstalled()) return;

    const ua = navigator.userAgent;
    const isFirefox = /Firefox|FxiOS/i.test(ua);
    const isChromium = /Chrome|CriOS|Chromium|Edg|OPR|Brave/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !isChromium && !isFirefox;

    if (!isSafari) return;

    const isIos = /iPhone|iPad|iPod/i.test(ua) || this.isIpadDesktopMode();
    this.installMode.set(isIos ? 'iosSafari' : 'macSafari');
    this.title.set('Add OceanSPT to your Home Screen');
    this.message.set(
      isIos
        ? 'Tap Share, then Add to Home Screen.'
        : 'In Safari, use File > Add to Dock for app-style access.',
    );
    this.isVisible.set(true);
  }

  private isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private isIpadDesktopMode(): boolean {
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }

  private wasDismissed(): boolean {
    try {
      return localStorage.getItem(this.storageKey) === 'true';
    } catch {
      return false;
    }
  }

  private rememberDismissed(): void {
    try {
      localStorage.setItem(this.storageKey, 'true');
    } catch {}
  }
}
