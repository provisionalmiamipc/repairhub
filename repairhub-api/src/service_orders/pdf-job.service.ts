import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ServiceOrderPuppeteerPdfService } from './puppeteer-pdf.service';
import { ServiceOrderSampleOverlayPdfService } from './sample-overlay-pdf.service';
import { ServiceOrderPdfService } from './pdf.service';
import { ServiceOrderMailService } from './mail.service';

@Injectable()
export class ServiceOrderPdfJobService implements OnModuleDestroy {
  private queue: Array<any> = [];
  private running = false;
  private stopped = false;
  private concurrency = Number(process.env.PDF_JOB_CONCURRENCY || 2);

  constructor(
    private readonly puppeteerService: ServiceOrderPuppeteerPdfService,
    private readonly overlayService: ServiceOrderSampleOverlayPdfService,
    private readonly pdfService: ServiceOrderPdfService,
    private readonly mailService: ServiceOrderMailService,
  ) {}

  enqueue(job: { pdfData: any; }) {
    this.queue.push(job);
    this.processQueue();
  }

  private async processQueue() {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      while (this.queue.length > 0 && !this.stopped) {
        const batch = this.queue.splice(0, this.concurrency);
        await Promise.all(batch.map(j => this.handleJob(j).catch(()=>{})));
      }
    } finally {
      this.running = false;
    }
  }

  private async handleJob(job: { pdfData: any }) {
    // choose generator using injected services
    try {
      let pdfBuffer: Buffer | null = null;
      if (this.puppeteerService && typeof this.puppeteerService.generate === 'function') {
        pdfBuffer = await this.puppeteerService.generate(job.pdfData);
      } else if (this.overlayService && typeof this.overlayService.generate === 'function') {
        pdfBuffer = await this.overlayService.generate(job.pdfData);
      } else if (this.pdfService && typeof this.pdfService.generate === 'function') {
        pdfBuffer = await this.pdfService.generate(job.pdfData);
      }

      if (pdfBuffer && this.mailService && typeof this.mailService.sendOrderCreatedMail === 'function') {
        await this.mailService.sendOrderCreatedMail(job.pdfData, pdfBuffer);
      }
    } catch (e) {
      // swallow errors; in a robust implementation we'd persist job for retry
    }
  }

  async onModuleDestroy() {
    this.stopped = true;
    // wait for running tasks to finish briefly
    const start = Date.now();
    while (this.running && Date.now() - start < 5000) {
      // wait up to 5s
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 200));
    }
  }
}
