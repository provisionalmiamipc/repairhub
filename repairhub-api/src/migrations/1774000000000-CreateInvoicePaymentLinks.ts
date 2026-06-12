import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicePaymentLinks1774000000000 implements MigrationInterface {
  name = 'CreateInvoicePaymentLinks1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_payment_links" (
        "id" SERIAL NOT NULL,
        "invoiceId" integer NOT NULL,
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
        CONSTRAINT "UQ_invoice_payment_links_idempotency" UNIQUE ("idempotencyKey"),
        CONSTRAINT "PK_invoice_payment_links" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoice_payment_links_invoice" ON "invoice_payment_links" ("invoiceId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoice_payment_links_status" ON "invoice_payment_links" ("status")`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_invoice_payment_links_active"
      ON "invoice_payment_links" ("invoiceId")
      WHERE "status" IN ('pending', 'failed')
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_invoice_payment_links_invoice') THEN
          ALTER TABLE "invoice_payment_links"
          ADD CONSTRAINT "FK_invoice_payment_links_invoice"
          FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoice_payment_links" DROP CONSTRAINT IF EXISTS "FK_invoice_payment_links_invoice"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_invoice_payment_links_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_payment_links_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_payment_links_invoice"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_payment_links"`);
  }
}
