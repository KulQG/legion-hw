-- AlterTable
ALTER TABLE "users"
ADD COLUMN "balance" DECIMAL(14, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE
    "transfers" (
        "id" UUID NOT NULL,
        "from_account_id" UUID NOT NULL,
        "to_account_id" UUID NOT NULL,
        "idempotency_key" TEXT NOT NULL,
        "sum" DECIMAL(14, 2) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "transfers_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "transfers_sum_positive" CHECK ("sum" > 0),
        CONSTRAINT "transfers_different_accounts" CHECK ("from_account_id" <> "to_account_id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "transfers_idempotency_key_key" ON "transfers" ("idempotency_key");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "users" ADD CONSTRAINT "user_balance_non_negative" CHECK ("balance" >= 0)