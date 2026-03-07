import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { RepairAssistantService } from './repair_assistant.service';
import { AnalyzeManualDto } from './dto/analyze-manual.dto';
import { ManualAnalyzerService } from './manual-analyzer.service';
import { SearchWebDto } from './dto/search-web.dto';
import { WebSearchService } from './web-search/web-search.service';
import { RecommendDto } from './dto/recommend.dto';
import { RepairAssistantOrchestratorService } from './repair_assistant-orchestrator.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LlmService, LlmStreamEvent } from '../llm/llm.service';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@ApiTags('Repair Assistant')
@Controller(['repair-assistant'])
export class RepairAssistantController {
  constructor(
    private readonly repairAssistantService: RepairAssistantService,
    private readonly manualAnalyzerService: ManualAnalyzerService,
    private readonly webSearchService: WebSearchService,
    private readonly repairAssistantOrchestratorService: RepairAssistantOrchestratorService,
    private readonly llmService: LlmService,
  ) {}

  private sseSend(
    res: Response,
    eventName: string,
    dataObjOrString: unknown,
    eventId: number,
  ) {
    const payload =
      typeof dataObjOrString === 'string' ? dataObjOrString : JSON.stringify(dataObjOrString);
    const lines = payload.split(/\r?\n/);

    res.write(`id: ${eventId}\n`);
    res.write(`event: ${eventName}\n`);
    for (const line of lines) {
      res.write(`data: ${line}\n`);
    }
    res.write('\n');
  }

  @Post('upload-pdf')
  @ApiOperation({ summary: 'Upload a PDF for in-memory processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'PDF uploaded and text extracted' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const isPdfByMime = file.mimetype === 'application/pdf';
        const isPdfByExt = extname(file.originalname).toLowerCase() === '.pdf';

        if (!isPdfByMime && !isPdfByExt) {
          return cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('You must send a PDF file in the "file" field');
    }

    const extracted = await this.repairAssistantService.extractTextFromPdfBuffer(file.buffer);

    return {
      message: 'PDF processed in memory successfully',
      file: {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
      extracted,
    };
  }

  @Post('analyze-manual')
  @ApiOperation({ summary: 'Mode 1: analyze manuals linked to a service order' })
  @ApiResponse({ status: 201, description: 'Manual analysis completed' })
  analyzeManual(@Body() dto: AnalyzeManualDto) {
    return this.manualAnalyzerService.analyzeManual(dto);
  }

  @Post('chat')
  @ApiOperation({ summary: 'LLM chat assistant (service order context + optional PDF in-memory)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        serviceOrderId: { type: 'string' },
        question: { type: 'string' },
        device: { type: 'string' },
        brand: { type: 'string' },
        model: { type: 'string' },
        defect: { type: 'string' },
        pdf: { type: 'string', format: 'binary' },
      },
      required: ['serviceOrderId', 'question'],
    },
  })
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const isPdfByMime = file.mimetype === 'application/pdf';
        const isPdfByExt = extname(file.originalname).toLowerCase() === '.pdf';
        if (!isPdfByMime && !isPdfByExt) {
          return cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        files: 1,
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  chat(
    @Body()
    body: {
      serviceOrderId: string;
      question: string;
      device?: string;
      brand?: string;
      model?: string;
      defect?: string;
    },
    @UploadedFile() pdf?: Express.Multer.File,
  ) {
    return this.repairAssistantService.chatWithAssistant({
      ...body,
      pdfBuffer: pdf?.buffer,
    });
  }

  @Post('search-web')
  @ApiOperation({ summary: 'Mode 2: web fallback for technical solution search' })
  @ApiResponse({ status: 201, description: 'Web search completed or served from cache' })
  searchWeb(@Body() dto: SearchWebDto) {
    return this.webSearchService.searchWeb(dto);
  }

  @Post('recommend')
  @ApiOperation({ summary: 'Combined flow (internal cases -> manual -> web)' })
  @ApiResponse({ status: 201, description: 'Final structured technical recommendation' })
  recommend(@Body() dto: RecommendDto) {
    return this.repairAssistantOrchestratorService.recommend(dto);
  }

  @Post('recommend/stream')
  @ApiOperation({ summary: 'Combined flow with SSE streaming' })
  @ApiResponse({ status: 200, description: 'SSE stream: meta/chunk/final/error/done' })
  async recommendStream(
    @Body() dto: RecommendDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let eventId = 1;
    let closed = false;
    let pingTimer: NodeJS.Timeout | null = null;
    const controller = new AbortController();
    const requestId = randomUUID();
    let pack: Awaited<ReturnType<typeof this.repairAssistantOrchestratorService.recommendWithEvidence>> | null = null;

    const closeHandler = () => {
      closed = true;
      controller.abort();
      if (pingTimer) clearInterval(pingTimer);
    };
    req.on('close', closeHandler);

    const send = (eventName: string, payload: unknown) => {
      if (!closed) this.sseSend(res, eventName, payload, eventId++);
    };

    try {
      pingTimer = setInterval(() => {
        send('ping', { ts: Date.now() });
      }, 15000);

      pack = await this.repairAssistantOrchestratorService.recommendWithEvidence(dto);
      const llmInput = {
        equipment: pack.context,
        evidence: pack.evidence,
        heuristicPlan: pack.heuristicPlan,
      };

      const stream = await this.llmService.streamRepairPlanOrNull(llmInput, controller.signal);
      if (!stream) {
        send('meta', {
          engine: 'heuristic',
          serviceOrderId: String(pack.serviceOrderId),
          requestId,
        });
        const finalPlan = await this.repairAssistantOrchestratorService.finalizeAndPersist(pack, {
          streamed: true,
          preferredPlan: null,
          streamFailed: false,
          signal: controller.signal,
        });
        send('final', finalPlan);
        send('done', { ok: true });
        return res.end();
      }

      send('meta', { engine: 'llm', serviceOrderId: String(pack.serviceOrderId), requestId });

      let streamFailed = false;
      let streamFinalJson: any = null;
      try {
        for await (const ev of stream) {
          if (closed) break;
          const event = ev as LlmStreamEvent;
          if (event.type === 'text_delta') send('chunk', { text: event.text });
          if (event.type === 'final_json') streamFinalJson = event.json;
          if (event.type === 'error') {
            streamFailed = true;
            send('error', { code: event.code, message: event.message });
            break;
          }
        }
      } catch (error: any) {
        streamFailed = true;
        send('error', {
          code: 'LLM_STREAM_FAILED',
          message: error?.message ?? 'LLM provider stream failed',
        });
      }

      let preferredPlan = streamFinalJson;
      if (!streamFailed && !preferredPlan) {
        preferredPlan = await this.llmService.generateRepairPlan(llmInput, controller.signal);
      }

      const finalPlan = await this.repairAssistantOrchestratorService.finalizeAndPersist(pack, {
        streamed: true,
        preferredPlan: preferredPlan ?? null,
        streamFailed,
        signal: controller.signal,
      });
      send('final', finalPlan);
      send('done', { ok: true });
      return res.end();
    } catch (error: any) {
      send('error', { code: 'STREAM_FATAL', message: error?.message ?? 'Internal streaming error' });

      if (pack) {
        const finalPlan = await this.repairAssistantOrchestratorService.finalizeAndPersist(pack, {
          streamed: true,
          preferredPlan: null,
          streamFailed: true,
        });
        send('final', finalPlan);
        send('done', { ok: true });
      } else {
        send('done', { ok: false });
      }

      if (!closed) res.end();
      return;
    } finally {
      if (pingTimer) clearInterval(pingTimer);
      req.off?.('close', closeHandler);
    }
  }
}
