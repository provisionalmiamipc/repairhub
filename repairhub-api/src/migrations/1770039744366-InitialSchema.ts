import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770039744366 implements MigrationInterface {
    name = 'InitialSchema1770039744366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "s_o_items" DROP CONSTRAINT "FK_fbb687cf0e34e52870a247e700a"`);
        await queryRunner.query(`ALTER TABLE "s_o_items" ALTER COLUMN "createdById" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "s_o_items" ALTER COLUMN "createdById" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "s_o_items" ADD CONSTRAINT "FK_fbb687cf0e34e52870a247e700a" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "s_o_items" DROP CONSTRAINT "FK_fbb687cf0e34e52870a247e700a"`);
        await queryRunner.query(`ALTER TABLE "s_o_items" ALTER COLUMN "createdById" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "s_o_items" ALTER COLUMN "createdById" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "s_o_items" ADD CONSTRAINT "FK_fbb687cf0e34e52870a247e700a" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
