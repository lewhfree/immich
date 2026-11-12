import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION asset_qr_delete_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO asset_qr_audit ("assetId")
      SELECT "assetId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`ALTER TABLE "asset_job_status" ADD "qrAt" timestamp with time zone;`.execute(db);
  await sql`CREATE TABLE "asset_qr_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "assetId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "asset_qr_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_qr_audit_assetId_idx" ON "asset_qr_audit" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_qr_audit_deletedAt_idx" ON "asset_qr_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "asset_qr" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "assetId" uuid NOT NULL,
  "x1" real NOT NULL,
  "y1" real NOT NULL,
  "x2" real NOT NULL,
  "y2" real NOT NULL,
  "x3" real NOT NULL,
  "y3" real NOT NULL,
  "x4" real NOT NULL,
  "y4" real NOT NULL,
  "payload" text NOT NULL,
  "isVisible" boolean NOT NULL DEFAULT true,
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "asset_qr_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "asset_qr_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "asset_qr_assetId_idx" ON "asset_qr" ("assetId");`.execute(db);
  await sql`CREATE INDEX "asset_qr_updateId_idx" ON "asset_qr" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_qr_delete_audit"
  AFTER DELETE ON "asset_qr"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION asset_qr_delete_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "asset_qr_updatedAt"
  BEFORE UPDATE ON "asset_qr"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_asset_qr_delete_audit', '{"type":"function","name":"asset_qr_delete_audit","sql":"CREATE OR REPLACE FUNCTION asset_qr_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO asset_qr_audit (\\"assetId\\")\\n      SELECT \\"assetId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_qr_delete_audit', '{"type":"trigger","name":"asset_qr_delete_audit","sql":"CREATE OR REPLACE TRIGGER \\"asset_qr_delete_audit\\"\\n  AFTER DELETE ON \\"asset_qr\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION asset_qr_delete_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_asset_qr_updatedAt', '{"type":"trigger","name":"asset_qr_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"asset_qr_updatedAt\\"\\n  BEFORE UPDATE ON \\"asset_qr\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER "asset_qr_delete_audit" ON "asset_qr";`.execute(db);
  await sql`DROP FUNCTION asset_qr_delete_audit;`.execute(db);
  await sql`ALTER TABLE "asset_job_status" DROP COLUMN "qrAt";`.execute(db);
  await sql`DROP TABLE "asset_qr_audit";`.execute(db);
  await sql`DROP TABLE "asset_qr";`.execute(db);
  await sql`DROP TRIGGER "asset_qr_updatedAt" ON "asset_qr";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_asset_qr_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_qr_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_asset_qr_updatedAt';`.execute(db);
}
