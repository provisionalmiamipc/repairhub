import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebCacheTable1773100000000 implements MigrationInterface {
  name = 'CreateWebCacheTable1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "web_cache" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "query_hash" text NOT NULL,
        "brand" text NOT NULL,
        "model" text NOT NULL,
        "defect" text NOT NULL,
        "results" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_web_cache_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_web_cache_query_hash" UNIQUE ("query_hash")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_web_cache_created_at"
      ON "web_cache" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_web_cache_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "web_cache"`);
  }
}
