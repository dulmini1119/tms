-- CreateTable
CREATE TABLE "rate_limit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_key_idx" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "rate_limit_expire_idx" ON "rate_limit"("expire");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");
