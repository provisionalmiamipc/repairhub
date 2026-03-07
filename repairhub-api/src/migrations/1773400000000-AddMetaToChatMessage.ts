import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetaToChatMessage1773400000000 implements MigrationInterface {
  name = 'AddMetaToChatMessage1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN IF NOT EXISTS "meta" jsonb NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN IF EXISTS "meta"`);
  }
}
