import { Module } from '@nestjs/common';
import { LLM_CONFIG, readLlmConfigFromEnv } from './llm.config';
import { GroqProvider, LLM_PROVIDER, LlmService } from './llm.service';

@Module({
  providers: [
    {
      provide: LLM_CONFIG,
      useFactory: () => readLlmConfigFromEnv(),
    },
    GroqProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: GroqProvider,
    },
    LlmService,
  ],
  exports: [LlmService, LLM_CONFIG],
})
export class LlmModule {}
