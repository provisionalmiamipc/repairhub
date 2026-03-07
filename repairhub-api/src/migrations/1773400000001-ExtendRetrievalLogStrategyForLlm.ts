import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendRetrievalLogStrategyForLlm1773400000001 implements MigrationInterface {
  name = 'ExtendRetrievalLogStrategyForLlm1773400000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "retrieval_log" DROP CONSTRAINT IF EXISTS "CHK_retrieval_log_strategy"`,
    );
    await queryRunner.query(`
      ALTER TABLE "retrieval_log"
      ADD CONSTRAINT "CHK_retrieval_log_strategy"
      CHECK ("strategy" IN ('case', 'manual', 'web', 'llm', 'heuristic'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "retrieval_log" DROP CONSTRAINT IF EXISTS "CHK_retrieval_log_strategy"`,
    );
    await queryRunner.query(`
      ALTER TABLE "retrieval_log"
      ADD CONSTRAINT "CHK_retrieval_log_strategy"
      CHECK ("strategy" IN ('case', 'manual', 'web'))
    `);
  }
}
