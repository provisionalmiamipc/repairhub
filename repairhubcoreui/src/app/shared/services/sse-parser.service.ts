import { Injectable } from '@angular/core';

export interface ParsedSseMessage {
  event: string;
  data: string;
  id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SseParserService {
  private buffer = '';

  push(chunk: string): ParsedSseMessage[] {
    this.buffer += chunk;
    this.buffer = this.buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const messages: ParsedSseMessage[] = [];
    let separatorIndex = this.buffer.indexOf('\n\n');

    while (separatorIndex !== -1) {
      const rawEvent = this.buffer.slice(0, separatorIndex);
      this.buffer = this.buffer.slice(separatorIndex + 2);
      separatorIndex = this.buffer.indexOf('\n\n');

      const parsed = this.parseEventBlock(rawEvent);
      if (parsed) messages.push(parsed);
    }

    return messages;
  }

  flush(): ParsedSseMessage[] {
    const remaining = this.buffer.trim();
    this.buffer = '';
    if (!remaining) return [];
    const parsed = this.parseEventBlock(remaining);
    return parsed ? [parsed] : [];
  }

  private parseEventBlock(rawEvent: string): ParsedSseMessage | null {
    const lines = rawEvent.split('\n');
    let eventName = 'message';
    let id: string | undefined;
    const dataLines: string[] = [];

    for (const line of lines) {
      if (!line) continue;
      if (line.startsWith(':')) continue;

      const colonIndex = line.indexOf(':');
      const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
      let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1);
      if (value.startsWith(' ')) value = value.slice(1);

      if (field === 'event') eventName = value || 'message';
      else if (field === 'id') id = value;
      else if (field === 'data') dataLines.push(value);
    }

    if (!dataLines.length && eventName === 'message' && !id) return null;

    return {
      event: eventName,
      data: dataLines.join('\n'),
      id,
    };
  }
}

