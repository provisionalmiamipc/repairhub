import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ParsedSseMessage, SseParserService } from './sse-parser.service';
import {
  RecommendRequest,
  RepairPlanOutput,
  StreamChunkEvent,
  StreamDoneEvent,
  StreamErrorEvent,
  StreamEvent,
  StreamFinalEvent,
  StreamMetaEvent,
  StreamPingEvent,
  UnknownStreamEvent,
} from '../models/repair-assistant-stream.models';

@Injectable({
  providedIn: 'root',
})
export class RepairAssistantStreamService {
  private readonly streamUrl = `${environment.apiUrl}/api/repair-assistant/recommend/stream`;

  constructor(
    private readonly authService: AuthService,
    private readonly sseParser: SseParserService,
  ) {}

  streamRecommend(
    req: RecommendRequest,
    options?: { signal?: AbortSignal },
  ): Observable<StreamEvent> {
    return new Observable<StreamEvent>((observer) => {
      const token = this.authService.getToken();
      if (!token) {
        observer.error(new Error('User is not authenticated: missing token'));
        return;
      }

      const internalController = new AbortController();
      const signal = internalController.signal;
      let externalAbortHandler: (() => void) | null = null;
      let stopped = false;
      let doneReceived = false;

      if (options?.signal) {
        externalAbortHandler = () => internalController.abort();
        options.signal.addEventListener('abort', externalAbortHandler, { once: true });
        if (options.signal.aborted) internalController.abort();
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      };

      (async () => {
        try {
          const response = await fetch(this.streamUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(req),
            signal,
          });

          if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
          }

          if (!response.body) {
            throw new Error('Streaming response does not include body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (!stopped) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const parsedEvents = this.sseParser.push(chunk);
            this.emitParsedEvents(parsedEvents, observer, (isDone) => {
              if (isDone) doneReceived = true;
            });
          }

          const tailEvents = this.sseParser.flush();
          this.emitParsedEvents(tailEvents, observer, (isDone) => {
            if (isDone) doneReceived = true;
          });

          if (!stopped && !doneReceived) observer.complete();
        } catch (error: any) {
          if (signal.aborted) {
            observer.complete();
            return;
          }
          observer.error(error instanceof Error ? error : new Error('Unknown streaming error'));
        }
      })();

      return () => {
        stopped = true;
        internalController.abort();
        if (options?.signal && externalAbortHandler) {
          options.signal.removeEventListener('abort', externalAbortHandler);
        }
      };
    });
  }

  private emitParsedEvents(
    parsedEvents: ParsedSseMessage[],
    observer: { next: (value: StreamEvent) => void; complete: () => void },
    markDone: (done: boolean) => void,
  ) {
    for (const parsed of parsedEvents) {
      const event = this.mapParsedEvent(parsed);
      observer.next(event);

      if (event.type === 'done') {
        markDone(true);
        observer.complete();
      }
    }
  }

  private mapParsedEvent(parsed: ParsedSseMessage): StreamEvent {
    const eventName = parsed.event || 'message';
    const data = parsed.data || '';

    if (eventName === 'meta') {
      const payload = this.parseJsonSafe<{
        engine: 'llm' | 'heuristic';
        serviceOrderId: string;
        requestId?: string;
      }>(data, {
        engine: 'heuristic',
        serviceOrderId: '',
      });
      return {
        type: 'meta',
        engine: payload.engine,
        serviceOrderId: String(payload.serviceOrderId ?? ''),
        requestId: payload.requestId,
      } as StreamMetaEvent;
    }

    if (eventName === 'chunk') {
      const payload = this.parseJsonSafe<{ text: string }>(data, { text: data });
      return { type: 'chunk', text: String(payload.text ?? '') } as StreamChunkEvent;
    }

    if (eventName === 'final') {
      const payload = this.parseJsonSafe<unknown>(data, null);
      return { type: 'final', plan: payload as RepairPlanOutput } as StreamFinalEvent;
    }

    if (eventName === 'error') {
      const payload = this.parseJsonSafe<{ code?: string; message?: string }>(data, {
        code: 'STREAM_ERROR',
        message: data,
      });
      return {
        type: 'error',
        code: String(payload.code ?? 'STREAM_ERROR'),
        message: String(payload.message ?? 'Error de streaming'),
      } as StreamErrorEvent;
    }

    if (eventName === 'done') {
      const payload = this.parseJsonSafe<{ ok?: boolean }>(data, { ok: true });
      return { type: 'done', ok: Boolean(payload.ok) } as StreamDoneEvent;
    }

    if (eventName === 'ping') {
      const payload = this.parseJsonSafe<{ ts?: number }>(data, {});
      return { type: 'ping', ts: payload.ts } as StreamPingEvent;
    }

    return {
      type: 'unknown',
      eventName,
      rawData: data,
    } as UnknownStreamEvent;
  }

  private parseJsonSafe<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
}
