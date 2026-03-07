import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRetrievalLogTable1773300000000 implements MigrationInterface {
  name = 'CreateRetrievalLogTable1773300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "retrieval_log" (
        "id" SERIAL PRIMARY KEY,
        "service_order_id" integer NOT NULL,
        "strategy" text NOT NULL,
        "score" numeric(8,4) NOT NULL,
        "meta" jsonb NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_retrieval_log_service_order_id_created_at"
      ON "retrieval_log" ("service_order_id", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "retrieval_log"
      ADD CONSTRAINT "CHK_retrieval_log_strategy"
      CHECK ("strategy" IN ('case', 'manual', 'web'))
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "retrieval_log"
      ADD CONSTRAINT "FK_retrieval_log_service_order"
      FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "retrieval_log" DROP CONSTRAINT IF EXISTS "FK_retrieval_log_service_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "retrieval_log" DROP CONSTRAINT IF EXISTS "CHK_retrieval_log_strategy"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_retrieval_log_service_order_id_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "retrieval_log"`);
  }
}
