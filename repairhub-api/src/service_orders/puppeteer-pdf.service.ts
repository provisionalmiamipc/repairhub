import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ServiceOrderPuppeteerPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(ServiceOrderPuppeteerPdfService.name);
  private browserPromise?: Promise<any>;
  private browserInstance: any;
  private idlePages: any[] = [];
  private pendingPageResolvers: Array<(page: any) => void> = [];
  private totalPages = 0;
  private readonly maxPages = Number(process.env.PDF_PAGE_POOL_SIZE || 4);

  async generate(order: any): Promise<Buffer> {
    // Lazy require to avoid hard dependency at startup
    const puppeteer = require('puppeteer');

    // Load template: prefer dist (__dirname), fallback to src/templates during dev
    const templatePath = join(__dirname, 'templates', 'service-order.html');
    let html: string;
    try {
      html = readFileSync(templatePath, 'utf8');
    } catch (err) {
      const altTemplate = join(process.cwd(), 'src', 'service_orders', 'templates', 'service-order.html');
      try {
        this.logger.warn(`Template not found at ${templatePath}, trying ${altTemplate}`);
        html = readFileSync(altTemplate, 'utf8');
      } catch (err2) {
        this.logger.error(`Service order template not found at ${templatePath} or ${altTemplate}`);
        throw err2;
      }
    }

    // Load logo as data URI if exists
    let logoDataUri = '';
    try {
      const logoPath = join(process.cwd(), 'src', 'uploads', 'logo.png');
      const logo = readFileSync(logoPath);
      const base64 = logo.toString('base64');
      logoDataUri = `data:image/png;base64,${base64}`;
    } catch (e) {
      // ignore if logo not found
    }

    const date = order.date instanceof Date ? order.date : new Date(order.date || Date.now());
    // Build items table HTML if items provided
    let itemsTable = '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:6px">Item</th><th style="text-align:right;border-bottom:1px solid #ddd;padding:6px">Qty</th><th style="text-align:right;border-bottom:1px solid #ddd;padding:6px">Price</th><th style="text-align:right;border-bottom:1px solid #ddd;padding:6px">Total</th></tr></thead><tbody>';
    if (order.items && Array.isArray(order.items) && order.items.length) {
      for (const it of order.items) {
        const desc = it.description || it.product || it.itemName || '';
        const qty = Number(it.quantity || it.qty || 1);
        const priceIt = Number(it.price || it.cost || it.unitPrice || 0);
        const totalIt = qty * priceIt - (Number(it.discount || 0) || 0);
        itemsTable += `<tr><td style="padding:6px;border-bottom:1px solid #f1f1f1">${desc}</td><td style="padding:6px;border-bottom:1px solid #f1f1f1;text-align:right">${qty}</td><td style="padding:6px;border-bottom:1px solid #f1f1f1;text-align:right">${priceIt.toFixed(2)}</td><td style="padding:6px;border-bottom:1px solid #f1f1f1;text-align:right">${totalIt.toFixed(2)}</td></tr>`;
      }
    }
    itemsTable += '</tbody></table>';

    const replacements: Record<string, string> = {
      '{{logoDataUri}}': logoDataUri,
      '{{orderCode}}': order.orderCode || '',
      '{{customerName}}': order.customerName || '',
      '{{customerEmail}}': order.customerEmail || '',
      '{{customerPhone}}': order.customerPhone || '',
      '{{customerAddress}}': order.customerAddress || '',
      '{{date}}': date.toLocaleDateString(),
      '{{device}}': order.device || '',
      '{{model}}': order.model || '',
      '{{serial}}': order.serial || '',
      '{{defectivePart}}': order.defectivePart || '',
      '{{price}}': (Number(order.price) || 0).toFixed(0),
      '{{repairCost}}': (Number(order.repairCost) || 0).toFixed(0),
      '{{advancePayment}}': (Number(order.advancePayment) || 0).toFixed(0),
      '{{tax}}': (Number(order.tax) || 0).toFixed(0),
      '{{discount}}': (Number(order.discount) || 0).toFixed(0),
      '{{total}}': (Number(order.total) || (Number(order.price) - Number(order.discount) + (Number(order.price) * Number(order.tax) / 100)) || 0).toFixed(0),
      '{{paymentType}}': order.paymentType || '',
      '{{assignedTech}}': order.assignedTech || '',
      '{{createdBy}}': order.createdBy || '',
      '{{estimated}}': order.estimated || '',
      '{{noteReception}}': order.noteReception || '',
      '{{terms}}': (order.terms || 'Terms and conditions...').replace(/\n/g, '<br/>'),
      '{{itemsTable}}': itemsTable,
    };

    for (const key in replacements) {
      html = html.split(key).join(replacements[key]);
    }

    // Reuse browser instance to avoid launching Chromium on every request
    const browser = await this.getBrowser();
    const page = await this.acquirePage(browser);
    try {
      // Wait for full network idle to ensure resources are loaded (fonts, images)
      const NAV_TIMEOUT = Number(process.env.PDF_PUPPETEER_NAV_TIMEOUT_MS || 60000);
      page.setDefaultNavigationTimeout(NAV_TIMEOUT);
      // Try once, and retry a single time on TimeoutError which can happen under load
      try {
        await page.setContent(html, { waitUntil: ['load', 'networkidle0'], timeout: NAV_TIMEOUT });
      } catch (err) {
        // If it's a navigation timeout, retry once with a longer timeout and gentler waitUntil
        const isTimeout = err && err.name && err.name.includes('Timeout');
        if (isTimeout) {
          this.logger.warn('setContent timed out, retrying with extended timeout and relaxed waitUntil');
          try {
            await page.setContent(html, { waitUntil: ['load'], timeout: NAV_TIMEOUT * 2 });
          } catch (err2) {
            this.logger.error('setContent retry failed', err2);
            throw err2;
          }
        } else {
          throw err;
        }
      }
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
      // Log basic buffer info
      // PDF generated
      // Quick sanity check: PDF buffers should start with %PDF
      try {
        const header = pdfBuffer.slice(0,4);
        if (!(header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46)) {
          this.logger.error('Generated PDF buffer does not start with %PDF — possible generation error');
        }
      } catch (e) {
        this.logger.error('Error while validating PDF buffer', e);
      }
      return pdfBuffer;
    } finally {
      // release page back to pool for reuse
      await this.releasePage(page);
    }
  }

  private async getBrowser() {
    if (!this.browserPromise) {
      this.browserPromise = (async () => {
        const puppeteer = require('puppeteer');
        try {
          const b = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
          this.browserInstance = b;
          return b;
        } catch (err) {
          const msg = err && err.message ? err.message : String(err);
          const needInstall = msg.includes('Could not find Chrome') || msg.includes('Could not find Chromium') || msg.includes('Could not find any chromium') || msg.includes('No executable'); 
          if (needInstall) {
            try {
              const { execSync } = require('child_process');
              this.logger.warn('Chromium not found. Attempting runtime install: npx puppeteer install chrome');
              execSync('npx puppeteer install chrome', { stdio: 'inherit', env: process.env });
              // after install, retry launch
              const b2 = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
              this.browserInstance = b2;
              return b2;
            } catch (installErr) {
              this.logger.error('Runtime puppeteer install failed', installErr);
              throw installErr;
            }
          }
          throw err;
        }
      })();
    }
    return this.browserPromise;
  }

  private async acquirePage(browser: any) {
    // return an idle page if available
    if (this.idlePages.length > 0) {
      return this.idlePages.pop();
    }
    // create new page if under limit
    if (this.totalPages < this.maxPages) {
      const p = await browser.newPage();
      this.totalPages += 1;
      return p;
    }
    // otherwise wait for a page to be released
    return new Promise<any>((resolve) => {
      this.pendingPageResolvers.push(resolve);
    });
  }

  private async releasePage(page: any) {
    try {
      if (!page || page.isClosed && page.isClosed()) {
        // page closed, decrement count
        this.totalPages = Math.max(0, this.totalPages - 1);
        return;
      }
      // if there are waiters, hand off directly
      const waiter = this.pendingPageResolvers.shift();
      if (waiter) {
        waiter(page);
        return;
      }
      // keep page idle
      this.idlePages.push(page);
    } catch (e) {
      try {
        if (page && page.close) await page.close();
      } catch (e2) {
        // ignore
      }
      this.totalPages = Math.max(0, this.totalPages - 1);
    }
  }

  async onModuleDestroy() {
    if (this.browserPromise) {
      try {
        const b = await this.browserPromise;
        // close idle pages first
        for (const p of this.idlePages) {
          try {
            if (p && typeof p.close === 'function') await p.close();
          } catch (e) {}
        }
        this.idlePages = [];
        // reject pending waiters
        for (const waiter of this.pendingPageResolvers) {
          try { waiter(null); } catch (e) {}
        }
        this.pendingPageResolvers = [];
        if (b && typeof b.close === 'function') await b.close();
      } catch (e) {
        // ignore errors on shutdown
      }
    }
  }
}
