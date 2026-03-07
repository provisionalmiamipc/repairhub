export interface RecommendRequest {
  serviceOrderId: string;
  device?: string;
  brand?: string;
  model?: string;
  defect?: string;
  documentIds?: string[];
}

export interface RepairPlanSource {
  type: 'case' | 'manual' | 'web';
  ref: string;
  excerpt?: string;
  url?: string;
  page?: number | null;
}

export interface RepairPlanOutput {
  origin: 'internal_case' | 'manual' | 'web' | 'mixed';
  probableDiagnosis: string;
  recommendedProcedure: string[];
  testsToPerform: string[];
  requiredTools: string[];
  risksAndPrecautions: string[];
  sources: RepairPlanSource[];
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

export interface StreamMetaEvent {
  type: 'meta';
  engine: 'llm' | 'heuristic';
  serviceOrderId: string;
  requestId?: string;
}

export interface StreamChunkEvent {
  type: 'chunk';
  text: string;
}

export interface StreamFinalEvent {
  type: 'final';
  plan: RepairPlanOutput;
}

export interface StreamErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface StreamDoneEvent {
  type: 'done';
  ok: boolean;
}

export interface StreamPingEvent {
  type: 'ping';
  ts?: number;
}

export interface UnknownStreamEvent {
  type: 'unknown';
  eventName: string;
  rawData: string;
}

export type StreamEvent =
  | StreamMetaEvent
  | StreamChunkEvent
  | StreamFinalEvent
  | StreamErrorEvent
  | StreamDoneEvent
  | StreamPingEvent
  | UnknownStreamEvent;
