/*
  Warnings:

  - A unique constraint covering the columns `[trip_assignment_id]` on the table `trip_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "actionable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" VARCHAR(20),
ADD COLUMN     "scheduled_for" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "trip_costs" ADD COLUMN     "invoice_id" UUID;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_number" VARCHAR(50) NOT NULL,
    "cab_service_id" UUID NOT NULL,
    "billing_month" VARCHAR(7) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Draft',
    "due_date" DATE,
    "paid_date" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "trip_logs_trip_assignment_id_key" ON "trip_logs"("trip_assignment_id");

-- AddForeignKey
ALTER TABLE "trip_costs" ADD CONSTRAINT "trip_costs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_cab_service_id_fkey" FOREIGN KEY ("cab_service_id") REFERENCES "cab_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
