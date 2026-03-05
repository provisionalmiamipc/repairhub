import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ServiceOrderPuppeteerPdfService } from './puppeteer-pdf.service';
import { ServiceOrderPdfService } from './pdf.service';
import { ServiceOrderMailService } from './mail.service';

@Injectable()
export class ServiceOrderPdfJobService implements OnModuleDestroy {
  private queue: Array<any> = [];
  private stopped = false;
  private concurrency = Number(process.env.PDF_JOB_CONCURRENCY || 2);
  // Number of currently active workers handling jobs
  private activeCount = 0;

  constructor(
    private readonly puppeteerService: ServiceOrderPuppeteerPdfService,
    private readonly pdfService: ServiceOrderPdfService,
    private readonly mailService: ServiceOrderMailService,
  ) {}

  enqueue(job: { pdfData: any; }) {
    this.queue.push(job);
    // job queued
    // Try to start workers immediately when a job arrives
    this.startWorkers();
  }

  /**
   * Start as many workers as possible up to `concurrency`.
   * Each worker takes one job and when finishes it will attempt to start another.
   * This makes processing reactive to job arrival and resource availability.
   */
  private startWorkers() {
    if (this.stopped) {
      return;
    }
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;
      this.activeCount += 1;
      // Run the job asynchronously; when finished decrement counter and try to start more
      (async () => {
        try {
          await this.handleJob(job);
        } catch (err) {
          console.error('ServiceOrderPdfJobService: handleJob error', err, { order: job?.pdfData?.orderCode || job?.pdfData?.id });
        } finally {
          try {
            this.activeCount = Math.max(0, this.activeCount - 1);
            // worker finished
            // Schedule next tick to avoid deep recursion
            setImmediate(() => this.startWorkers());
          } catch (e) {
            console.error('ServiceOrderPdfJobService: error in worker finally', e);
          }
        }
      })();
    }
    // workers started as needed
  }

  private async handleJob(job: { pdfData: any }) {
    // choose generator using injected services
    try {
      // handleJob start
      let pdfBuffer: Buffer | null = null;
      // Prefer pdfService.generateRepairPdfBuffer (pdfkit) when available
      if (this.pdfService && typeof (this.pdfService as any).generateRepairPdfBuffer === 'function') {
        pdfBuffer = await (this.pdfService as any).generateRepairPdfBuffer(job.pdfData);
      } else if (this.puppeteerService && typeof this.puppeteerService.generate === 'function') {
        pdfBuffer = await this.puppeteerService.generate(job.pdfData);
      } else if (this.pdfService && typeof this.pdfService.generate === 'function') {
        pdfBuffer = await this.pdfService.generate(job.pdfData);
      }

      if (pdfBuffer && this.mailService && typeof this.mailService.sendOrderCreatedMail === 'function') {
        try {
          await this.mailService.sendOrderCreatedMail(job.pdfData, pdfBuffer);
        } catch (err) {
          console.error('ServiceOrderPdfJobService: error sending email for order', job.pdfData?.orderCode || job.pdfData?.id || 'unknown', err);
          throw err;
        }
      }
    } catch (e) {
      console.error('ServiceOrderPdfJobService: unexpected error processing job', e);
      // In a more robust setup we would persist the job for retry or move to a DLQ
    }
  }

  async onModuleDestroy() {
    this.stopped = true;
    // wait for running tasks to finish briefly
    const start = Date.now();
    while (this.activeCount > 0 && Date.now() - start < 5000) {
      // wait up to 5s
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 200));
    }
  }
}
