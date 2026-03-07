import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiagnosisSessionTable1773200000000 implements MigrationInterface {
  name = 'CreateDiagnosisSessionTable1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "diagnosis_session" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "service_order_id" integer NOT NULL,
        "state" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_diagnosis_session_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_diagnosis_session_service_order_id"
      ON "diagnosis_session" ("service_order_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "diagnosis_session"
      ADD CONSTRAINT "FK_diagnosis_session_service_order"
      FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "diagnosis_session" DROP CONSTRAINT IF EXISTS "FK_diagnosis_session_service_order"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_diagnosis_session_service_order_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diagnosis_session"`);
  }
}
