-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending_review', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listing_fee_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listing_rejection_reason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "property_photos" ADD COLUMN     "cloudinary_url" TEXT,
ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_secret" VARCHAR(255),
ADD COLUMN     "verification_rejection_reason" TEXT,
ADD COLUMN     "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "listing_fee_payments" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ETB',
    "chapa_transaction_ref" TEXT,
    "chapa_checkout_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "target_resource" VARCHAR(50) NOT NULL,
    "target_id" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_fee_payments_chapa_transaction_ref_key" ON "listing_fee_payments"("chapa_transaction_ref");

-- CreateIndex
CREATE INDEX "listing_fee_payments_property_id_idx" ON "listing_fee_payments"("property_id");

-- CreateIndex
CREATE INDEX "listing_fee_payments_user_id_idx" ON "listing_fee_payments"("user_id");

-- CreateIndex
CREATE INDEX "listing_fee_payments_status_idx" ON "listing_fee_payments"("status");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "audit_logs_target_resource_idx" ON "audit_logs"("target_resource");

-- CreateIndex
CREATE INDEX "audit_logs_target_id_idx" ON "audit_logs"("target_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "properties_is_featured_idx" ON "properties"("is_featured");

-- CreateIndex
CREATE INDEX "property_photos_public_id_idx" ON "property_photos"("public_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_two_factor_enabled_idx" ON "users"("two_factor_enabled");

-- AddForeignKey
ALTER TABLE "listing_fee_payments" ADD CONSTRAINT "listing_fee_payments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_fee_payments" ADD CONSTRAINT "listing_fee_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
