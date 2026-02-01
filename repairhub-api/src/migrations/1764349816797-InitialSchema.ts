import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764349816797 implements MigrationInterface {
    name = 'InitialSchema1764349816797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "ownerType" character varying(20) NOT NULL, "ownerId" integer NOT NULL, "tokenHash" character varying(192) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP, "revoked" boolean NOT NULL DEFAULT false, "replacedById" integer, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
