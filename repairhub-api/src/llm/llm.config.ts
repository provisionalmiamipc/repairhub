export type LlmConfig = {
  enabled: boolean;
  provider: string;
  apiKey?: string;
  model?: string;
  baseURL?: string;
  timeoutMs: number;
};

export const LLM_CONFIG = 'LLM_CONFIG';

export function readLlmConfigFromEnv(env: NodeJS.ProcessEnv = process.env): LlmConfig {
  const enabled = String(env.LLM_ENABLED ?? 'true').toLowerCase() === 'true';
  const provider = String(env.LLM_PROVIDER || 'openai').toLowerCase();
  const apiKey = env.LLM_API_KEY || env.OPENAI_API_KEY || env.GROQ_API_KEY;
  const model = env.LLM_MODEL || env.OPENAI_MODEL || env.GROQ_MODEL;
  const baseURL = env.LLM_BASE_URL || undefined;
  const timeoutCandidate = Number(env.LLM_TIMEOUT_MS ?? 12000);
  const timeoutMs =
    Number.isFinite(timeoutCandidate) && timeoutCandidate > 0 ? timeoutCandidate : 12000;

  return {
    enabled,
    provider,
    apiKey,
    model,
    baseURL,
    timeoutMs,
  };
}
