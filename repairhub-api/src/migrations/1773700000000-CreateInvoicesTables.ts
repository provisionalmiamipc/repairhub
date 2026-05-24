import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesTables1773700000000 implements MigrationInterface {
  name = 'CreateInvoicesTables1773700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" SERIAL NOT NULL,
        "invoiceNumber" character varying NOT NULL,
        "centerId" integer NOT NULL,
        "storeId" integer NOT NULL,
        "customerId" integer NOT NULL,
        "serviceOrderId" integer,
        "createdById" integer,
        "status" character varying NOT NULL DEFAULT 'draft',
        "issueDate" date NOT NULL,
        "dueDate" date,
        "via" character varying,
        "billToName" character varying,
        "billToAddress" text,
        "billToContact" character varying,
        "subtotal" numeric(12,2) NOT NULL DEFAULT '0',
        "discount" numeric(12,2) NOT NULL DEFAULT '0',
        "tax" numeric(12,2) NOT NULL DEFAULT '0',
        "total" numeric(12,2) NOT NULL DEFAULT '0',
        "notes" text,
        "serviceSummary" text,
        "terms" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invoices_invoiceNumber" UNIQUE ("invoiceNumber"),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_items" (
        "id" SERIAL NOT NULL,
        "invoiceId" integer NOT NULL,
        "itemType" character varying NOT NULL,
        "itemId" integer,
        "serviceOrderId" integer,
        "description" text NOT NULL,
        "quantity" numeric(12,2) NOT NULL DEFAULT '1',
        "unitPrice" numeric(12,2) NOT NULL DEFAULT '0',
        "discount" numeric(12,2) NOT NULL DEFAULT '0',
        "lineTotal" numeric(12,2) NOT NULL DEFAULT '0',
        "sortOrder" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_invoice_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoices_customerId" ON "invoices" ("customerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoices_serviceOrderId" ON "invoices" ("serviceOrderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoice_items_invoiceId" ON "invoice_items" ("invoiceId")`);

    await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_center" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_store" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_customer" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_service_order" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_created_by" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_invoice_items_invoice" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_invoice_items_item" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_invoice_items_service_order" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "FK_invoice_items_service_order"`);
    await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "FK_invoice_items_item"`);
    await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "FK_invoice_items_invoice"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_created_by"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_service_order"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_customer"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_store"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_center"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_items_invoiceId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_serviceOrderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_customerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
  }
}
