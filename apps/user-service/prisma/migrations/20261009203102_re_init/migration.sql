-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "bio" VARCHAR(1000),
    "birth_date" TIMESTAMP(3) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "current_avatar" TEXT,
    "active_avatars_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatars" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "user_id" UUID NOT NULL,

    CONSTRAINT "avatars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users" USING GIN ("email" gin_trgm_ops) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users" USING GIN ("name" gin_trgm_ops) WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "users_active_avatars_count_idx" ON "users"("active_avatars_count") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "users_birth_date_idx" ON "users"("birth_date") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "avatars_user_id_idx" ON "avatars"("user_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "avatars_user_id_created_at_idx" ON "avatars"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
