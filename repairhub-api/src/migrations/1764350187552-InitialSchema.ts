import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764350187552 implements MigrationInterface {
    name = 'InitialSchema1764350187552'

    // This migration was generated multiple times and the table already exists in the database.
    // Make this migration a no-op to avoid duplicate creation errors.
    public async up(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // no-op
    }

}
