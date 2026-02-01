import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764351128126 implements MigrationInterface {
    name = 'InitialSchema1764351128126'

    // Duplicate generated migration — no-op to avoid double creation
    public async up(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

}
