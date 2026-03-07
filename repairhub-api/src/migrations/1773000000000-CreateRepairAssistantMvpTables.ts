import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRepairAssistantMvpTables1773000000000 implements MigrationInterface {
  name = 'CreateRepairAssistantMvpTables1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_message" (
        "id" SERIAL PRIMARY KEY,
        "serviceOrderId" integer NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_message_serviceOrderId_created_at"
      ON "chat_message" ("serviceOrderId", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_message"
      ADD CONSTRAINT "FK_chat_message_serviceOrderId"
      FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document" (
        "id" SERIAL PRIMARY KEY,
        "serviceOrderId" integer NULL,
        "filename" text NOT NULL,
        "storage_path" text NOT NULL,
        "mime_type" text NOT NULL,
        "size_bytes" bigint NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_serviceOrderId_created_at"
      ON "document" ("serviceOrderId", "created_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "document"
      ADD CONSTRAINT "FK_document_serviceOrderId"
      FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `).catch(() => undefined);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "repair_case" (
        "id" SERIAL PRIMARY KEY,
        "brand" text NOT NULL,
        "model" text NOT NULL,
        "defect" text NOT NULL,
        "symptoms" text NOT NULL,
        "root_cause" text NULL,
        "resolution_steps" jsonb NULL,
        "source" text NOT NULL DEFAULT 'internal',
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "repair_case"
      ADD CONSTRAINT "CHK_repair_case_source_internal"
      CHECK ("source" = 'internal')
    `).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "repair_case" DROP CONSTRAINT IF EXISTS "CHK_repair_case_source_internal"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "repair_case"`);

    await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT IF EXISTS "FK_document_serviceOrderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_document_serviceOrderId_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document"`);

    await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT IF EXISTS "FK_chat_message_serviceOrderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_message_serviceOrderId_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_message"`);
  }
}
