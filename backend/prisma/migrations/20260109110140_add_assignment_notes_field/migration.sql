/*
  Warnings:

  - You are about to alter the column `file_size` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "file_size" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "trip_assignments" ADD COLUMN     "assignment_notes" TEXT;
