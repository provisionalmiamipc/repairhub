import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceOrderPaymentLinks1773900000000 implements MigrationInterface {
  name = 'CreateServiceOrderPaymentLinks1773900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_order_payment_links" (
        "id" SERIAL NOT NULL,
        "serviceOrderId" integer NOT NULL,
        "concept" character varying NOT NULL,
        "title" character varying NOT NULL,
        "amount" bigint NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'USD',
        "status" character varying NOT NULL DEFAULT 'pending',
        "squarePaymentLinkId" character varying,
        "squareOrderId" character varying,
        "url" text,
        "idempotencyKey" character varying NOT NULL,
        "createdById" integer,
        "lastError" text,
        "lastCheckedAt" TIMESTAMP,
        "paidAt" TIMESTAMP,
        "deletedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_service_order_payment_links_idempotency" UNIQUE ("idempotencyKey"),
        CONSTRAINT "PK_service_order_payment_links" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_order_payment_links_order" ON "service_order_payment_links" ("serviceOrderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_order_payment_links_status" ON "service_order_payment_links" ("status")`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_service_order_payment_links_order') THEN
          ALTER TABLE "service_order_payment_links"
          ADD CONSTRAINT "FK_service_order_payment_links_order"
          FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_order_payment_links" DROP CONSTRAINT IF EXISTS "FK_service_order_payment_links_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_order_payment_links_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_order_payment_links_order"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_order_payment_links"`);
  }
}
