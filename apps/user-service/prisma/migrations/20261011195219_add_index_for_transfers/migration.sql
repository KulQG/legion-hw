-- DropIndex
DROP INDEX "users_active_avatars_count_idx";

-- DropIndex
DROP INDEX "users_birth_date_idx";

-- CreateIndex
CREATE INDEX "transfers_from_account_id_id_idx" ON "transfers"("from_account_id", "id" DESC);

-- CreateIndex
CREATE INDEX "users_active_avatars_count_id_idx" ON "users"("active_avatars_count", "id" DESC) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "users_birth_date_id_idx" ON "users"("birth_date", "id" DESC) WHERE (deleted_at IS NULL);
