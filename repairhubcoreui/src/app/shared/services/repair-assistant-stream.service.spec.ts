import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { RepairAssistantStreamService } from './repair-assistant-stream.service';
import { SseParserService } from './sse-parser.service';
import { RecommendRequest, StreamEvent } from '../models/repair-assistant-stream.models';

class AuthServiceStub {
  token: string | null = 'token-test';

  getToken(): string | null {
    return this.token;
  }
}

describe('RepairAssistantStreamService', () => {
  let service: RepairAssistantStreamService;
  let authStub: AuthServiceStub;
  let fetchSpy: jasmine.Spy<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

  const req: RecommendRequest = {
    serviceOrderId: 'so-1',
    brand: 'sony',
    model: 'x1',
    defect: 'no enciende',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RepairAssistantStreamService,
        SseParserService,
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });

    service = TestBed.inject(RepairAssistantStreamService);
    authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    fetchSpy = spyOn(window, 'fetch');
  });

  function createSseResponse(chunks: string[], status = 200): Response {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(body, {
      status,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  it('debe emitir error si no hay token', (done) => {
    authStub.token = null;

    service.streamRecommend(req).subscribe({
      next: () => fail('no debe emitir eventos'),
      error: (error) => {
        expect(error).toBeTruthy();
        expect(String(error.message)).toContain('missing token');
        expect(fetchSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('debe enviar headers correctos y procesar meta + done', (done) => {
    fetchSpy.and.resolveTo(
      createSseResponse([
        'event: meta\n',
        'data: {"engine":"heuristic","serviceOrderId":"so-1"}\n\n',
        'event: done\n',
        'data: {"ok":true}\n\n',
      ]),
    );

    const events: StreamEvent[] = [];
    service.streamRecommend(req).subscribe({
      next: (event) => events.push(event),
      error: (error) => fail(String(error)),
      complete: () => {
        expect(fetchSpy).toHaveBeenCalled();

        const [, init] = fetchSpy.calls.mostRecent().args;
        const requestInit = init as RequestInit;
        const headers = requestInit.headers as Record<string, string>;

        expect(requestInit.method).toBe('POST');
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Accept']).toBe('text/event-stream');
        expect(headers['Authorization']).toBe('Bearer token-test');

        expect(events.length).toBe(2);
        expect(events[0].type).toBe('meta');
        expect(events[1]).toEqual({ type: 'done', ok: true });
        done();
      },
    });
  });

  it('debe emitir chunk, final y done en orden', (done) => {
    fetchSpy.and.resolveTo(
      createSseResponse([
        'event: chunk\n',
        'data: {"text":"Paso 1"}\n\n',
        'event: chunk\n',
        'data: {"text":"Paso 2"}\n\n',
        'event: final\n',
        'data: {"origin":"manual","probableDiagnosis":"falla","recommendedProcedure":[],"testsToPerform":[],"requiredTools":[],"risksAndPrecautions":[],"sources":[],"confidence":"low","notes":[]}\n\n',
        'event: done\n',
        'data: {"ok":true}\n\n',
      ]),
    );

    const events: StreamEvent[] = [];

    service.streamRecommend(req).subscribe({
      next: (event) => events.push(event),
      error: (error) => fail(String(error)),
      complete: () => {
        expect(events.map((e) => e.type)).toEqual(['chunk', 'chunk', 'final', 'done']);
        const finalEvent = events.find((e) => e.type === 'final');
        expect(finalEvent).toBeTruthy();
        done();
      },
    });
  });

  it('debe emitir error del observable cuando fetch responde no OK', (done) => {
    fetchSpy.and.resolveTo(createSseResponse(['bad'], 500));

    service.streamRecommend(req).subscribe({
      next: () => fail('no debe emitir next'),
      error: (error) => {
        expect(String(error.message)).toContain('HTTP 500');
        done();
      },
      complete: () => fail('no debe completar en error HTTP'),
    });
  });

  it('debe abortar fetch al desuscribirse', async () => {
    let capturedSignal: AbortSignal | undefined;
    fetchSpy.and.callFake(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;
      return createSseResponse([]);
    });

    const subscription = service.streamRecommend(req).subscribe();
    subscription.unsubscribe();

    await Promise.resolve();

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBeTrue();
  });
});
