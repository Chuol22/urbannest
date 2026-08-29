-- Add tier field to listing_fee_payments
ALTER TABLE "listing_fee_payments" ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'standard';

-- Add listing tier and expiry fields to properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "listing_tier" TEXT DEFAULT 'standard';
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "listing_expires_at" TIMESTAMP(3);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "listing_fee_payments_tier_idx" ON "listing_fee_payments"("tier");
CREATE INDEX IF NOT EXISTS "properties_listing_tier_idx" ON "properties"("listing_tier");
CREATE INDEX IF NOT EXISTS "properties_listing_expires_at_idx" ON "properties"("listing_expires_at");

-- Update existing paid listings to have standard tier
UPDATE "properties" SET "listing_tier" = 'standard' WHERE "listing_fee_paid" = true AND "listing_tier" IS NULL;
