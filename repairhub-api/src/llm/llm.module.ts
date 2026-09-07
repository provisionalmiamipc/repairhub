import { Module } from '@nestjs/common';
import { LLM_CONFIG, readLlmConfigFromEnv } from './llm.config';
import { LLM_PROVIDER, LlmService, OpenAiCompatibleProvider } from './llm.service';

@Module({
  providers: [
    {
      provide: LLM_CONFIG,
      useFactory: () => readLlmConfigFromEnv(),
    },
    OpenAiCompatibleProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: OpenAiCompatibleProvider,
    },
    LlmService,
  ],
  exports: [LlmService, LLM_CONFIG],
})
export class LlmModule {}
