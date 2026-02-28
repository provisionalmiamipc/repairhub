// storage/storage.module.ts
import { Module } from '@nestjs/common';
import { SupabaseModule } from 'nestjs-supabase-js';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    SupabaseModule.injectClient(), // ¡Esto es importante!
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}