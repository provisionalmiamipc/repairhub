import { SseParserService } from './sse-parser.service';

describe('SseParserService', () => {
  let parser: SseParserService;

  beforeEach(() => {
    parser = new SseParserService();
  });

  it('parses meta + done', () => {
    const events = parser.push(
      'event: meta\ndata: {"engine":"heuristic","serviceOrderId":"123"}\n\n' +
        'event: done\ndata: {"ok":true}\n\n',
    );

    expect(events.length).toBe(2);
    expect(events[0].event).toBe('meta');
    expect(events[1].event).toBe('done');
  });

  it('parses 3 chunk + final + done', () => {
    const events = parser.push(
      'event: chunk\ndata: {"text":"a"}\n\n' +
        'event: chunk\ndata: {"text":"b"}\n\n' +
        'event: chunk\ndata: {"text":"c"}\n\n' +
        'event: final\ndata: {"origin":"web"}\n\n' +
        'event: done\ndata: {"ok":true}\n\n',
    );

    expect(events.length).toBe(5);
    expect(events.filter((e) => e.event === 'chunk').length).toBe(3);
    expect(events[3].event).toBe('final');
    expect(events[4].event).toBe('done');
  });

  it('handles event split in two buffers', () => {
    const first = parser.push('event: chunk\ndata: {"text":"par');
    const second = parser.push('te1"}\n\nevent: done\ndata: {"ok":true}\n\n');

    expect(first.length).toBe(0);
    expect(second.length).toBe(2);
    expect(second[0].event).toBe('chunk');
    expect(second[1].event).toBe('done');
  });

  it('handles multiline data fields', () => {
    const events = parser.push(
      'event: chunk\ndata: linea1\ndata: linea2\ndata: linea3\n\n',
    );

    expect(events.length).toBe(1);
    expect(events[0].event).toBe('chunk');
    expect(events[0].data).toBe('linea1\nlinea2\nlinea3');
  });

  it('parses error event followed by done', () => {
    const events = parser.push(
      'event: error\ndata: {"code":"LLM_STREAM_FAILED","message":"fail"}\n\n' +
        'event: done\ndata: {"ok":true}\n\n',
    );

    expect(events.length).toBe(2);
    expect(events[0].event).toBe('error');
    expect(events[1].event).toBe('done');
  });

  it('flushes trailing event without separator', () => {
    parser.push('event: meta\ndata: {"engine":"heuristic","serviceOrderId":"123"}');
    const events = parser.flush();
    expect(events.length).toBe(1);
    expect(events[0].event).toBe('meta');
  });
});

