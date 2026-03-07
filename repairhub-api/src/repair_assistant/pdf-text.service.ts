import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

export type PdfPageText = {
  page: number | null;
  text: string;
};

export type ExtractedPdf = {
  text: string;
  pages: PdfPageText[];
  numPages: number;
  lowText: boolean;
};

type PdfParseResult = {
  text?: string;
  numpages?: number;
};

type PdfParseFn = (
  pdfBuffer: Buffer,
  options?: {
    pagerender?: (pageData: any) => Promise<string>;
  },
) => Promise<PdfParseResult>;

@Injectable()
export class PdfTextService {
  private loadPdfParse(): PdfParseFn {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded = require('pdf-parse');
      return loaded?.default ?? loaded;
    } catch {
      throw new Error(
        'La dependencia "pdf-parse" no esta instalada. Ejecuta: npm install pdf-parse',
      );
    }
  }

  private async extractFromBuffer(pdfBuffer: Buffer): Promise<ExtractedPdf> {
    const pdfParse = this.loadPdfParse();

    const pages: PdfPageText[] = [];
    let pageCounter = 0;

    const parsed = await pdfParse(pdfBuffer, {
      pagerender: async (pageData: any) => {
        pageCounter += 1;
        const textContent = await pageData.getTextContent();
        const pageText = (textContent.items || [])
          .map((item: any) => item?.str ?? '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        pages.push({ page: pageCounter, text: pageText });
        return pageText;
      },
    });

    const mergedText = (parsed.text ?? '').replace(/\s+/g, ' ').trim();
    const effectivePages = pages.length
      ? pages
      : [{ page: null, text: mergedText }];
    const totalChars = effectivePages.reduce((sum, page) => sum + page.text.length, 0);

    return {
      text: mergedText,
      pages: effectivePages,
      numPages: parsed.numpages ?? effectivePages.length,
      lowText: totalChars < 120,
    };
  }

  async extractFromPath(filePath: string): Promise<ExtractedPdf> {
    const pdfBuffer = await readFile(filePath);
    return this.extractFromBuffer(pdfBuffer);
  }

  async extractFromMemory(pdfBuffer: Buffer): Promise<ExtractedPdf> {
    return this.extractFromBuffer(pdfBuffer);
  }
}
