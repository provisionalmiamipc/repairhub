import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaAssetsTable1773500000000
  implements MigrationInterface
{
  name = 'CreateMediaAssetsTable1773500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "media_assets" (
        "id" SERIAL NOT NULL,
        "ownerType" character varying NOT NULL,
        "ownerId" integer NOT NULL,
        "kind" character varying NOT NULL DEFAULT 'image',
        "status" character varying NOT NULL DEFAULT 'pending',
        "bucket" character varying NOT NULL,
        "displayKey" character varying,
        "thumbnailKey" character varying,
        "originalName" character varying NOT NULL,
        "mimeType" character varying,
        "displaySize" integer,
        "thumbnailSize" integer,
        "width" integer,
        "height" integer,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "error" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media_assets_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_media_assets_owner"
      ON "media_assets" ("ownerType", "ownerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_media_assets_owner"');
    await queryRunner.query('DROP TABLE IF EXISTS "media_assets"');
  }
}
