import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairAssistantController } from './repair_assistant.controller';
import { RepairAssistantService } from './repair_assistant.service';
import { PdfTextService } from './pdf-text.service';
import { SimpleRanker } from './simple-ranker.service';
import { ManualAnalyzerService } from './manual-analyzer.service';
import { ServiceOrder } from '../service_orders/entities/service_order.entity';
import { DocumentEntity } from '../documents/entities/document.entity';
import { ChatMessage } from '../chat_messages/entities/chat_message.entity';
import { WebCache } from '../web_cache/entities/web_cache.entity';
import { ProcedureExtractor } from './web-search/procedure-extractor.service';
import { SEARCH_PROVIDER_TOKEN } from './web-search/search-provider.interface';
import { NoopSearchProvider } from './web-search/noop-search.provider';
import { DuckDuckGoSearchProvider } from './web-search/duckduckgo-search.provider';
import { GroqSearchProvider } from './web-search/groq-search.provider';
import { WebSearchService } from './web-search/web-search.service';
import { RepairCase } from '../repair_cases/entities/repair_case.entity';
import { RetrievalLog } from '../retrieval_log/entities/retrieval_log.entity';
import { RepairAssistantOrchestratorService } from './repair_assistant-orchestrator.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    LlmModule,
    TypeOrmModule.forFeature([
      ServiceOrder,
      DocumentEntity,
      ChatMessage,
      WebCache,
      RepairCase,
      RetrievalLog,
    ]),
  ],
  controllers: [RepairAssistantController],
  providers: [
    RepairAssistantService,
    PdfTextService,
    SimpleRanker,
    ManualAnalyzerService,
    ProcedureExtractor,
    WebSearchService,
    NoopSearchProvider,
    DuckDuckGoSearchProvider,
    GroqSearchProvider,
    {
      provide: SEARCH_PROVIDER_TOKEN,
      inject: [GroqSearchProvider, DuckDuckGoSearchProvider, NoopSearchProvider],
      useFactory: (
        groqSearchProvider: GroqSearchProvider,
        duckDuckGoSearchProvider: DuckDuckGoSearchProvider,
        noopSearchProvider: NoopSearchProvider,
      ) => {
        const provider = (process.env.WEB_SEARCH_PROVIDER ?? 'groq').toLowerCase();
        if (provider === 'noop' || provider === 'none' || provider === 'disabled') {
          return noopSearchProvider;
        }
        if (provider === 'groq') {
          return groqSearchProvider;
        }
        if (provider === 'duckduckgo' || provider === 'ddg') {
          return duckDuckGoSearchProvider;
        }

        // default selection: Groq if API key exists, otherwise DuckDuckGo.
        if (process.env.GROQ_API_KEY) {
          return groqSearchProvider;
        }
        return duckDuckGoSearchProvider;
      },
    },
    RepairAssistantOrchestratorService,
  ],
})
export class RepairAssistantModule {}
