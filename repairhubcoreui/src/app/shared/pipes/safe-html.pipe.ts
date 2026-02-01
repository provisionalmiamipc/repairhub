import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * SafeHtmlPipe: Sanitiza HTML para prevenir XSS
 * Uso: {{ userData.notes | safeHtml }}
 */
@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    // Remover scripts y elementos peligrosos
    const div = document.createElement('div');
    div.textContent = value;

    // Permitir saltos de línea
    return this.sanitizer.sanitize(1, value) || '';
  }
}

/**
 * TrustHtmlPipe: Para HTML de confianza (ej: de BD, verificado)
 * Uso: {{ htmlContent | trustHtml }}
 * ⚠️ SOLO usar con HTML que controlas
 */
@Pipe({
  name: 'trustHtml',
  standalone: true
})
export class TrustHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

/**
 * SafeUrlPipe: Sanitiza URLs para prevenir XSS en atributos href/src
 * Uso: <a [href]="link | safeUrl">{{ link }}</a>
 */
@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    // Validar que sea una URL segura (evitar javascript:)
    if (value.toLowerCase().startsWith('javascript:')) {
      console.warn('Potential XSS attempt blocked:', value);
      return null;
    }

    return this.sanitizer.bypassSecurityTrustUrl(value);
  }
}
