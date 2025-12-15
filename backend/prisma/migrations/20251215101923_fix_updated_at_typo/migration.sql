-- AlterTable
ALTER TABLE "cab_agreements" ADD COLUMN     "document_url" VARCHAR(500),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cab_services" ALTER COLUMN "updated_at" DROP DEFAULT;
