import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokensTable1764351697600 implements MigrationInterface {
    name = 'CreateRefreshTokensTable1764351697600'

    // This migration duplicates an earlier migration that already created the table.
    // Make it a no-op to prevent 'relation already exists' errors.
    public async up(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

}
