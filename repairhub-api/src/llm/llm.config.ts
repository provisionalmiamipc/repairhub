export type LlmConfig = {
  enabled: boolean;
  provider: 'groq';
  groqApiKey?: string;
  model: string;
  timeoutMs: number;
};

export const LLM_CONFIG = 'LLM_CONFIG';

export function readLlmConfigFromEnv(env: NodeJS.ProcessEnv = process.env): LlmConfig {
  const enabled = String(env.LLM_ENABLED ?? 'true').toLowerCase() === 'true';
  const provider = 'groq' as const;
  const model = env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const timeoutCandidate = Number(env.LLM_TIMEOUT_MS ?? 12000);
  const timeoutMs =
    Number.isFinite(timeoutCandidate) && timeoutCandidate > 0 ? timeoutCandidate : 12000;

  return {
    enabled,
    provider,
    groqApiKey: env.GROQ_API_KEY,
    model,
    timeoutMs,
  };
}
