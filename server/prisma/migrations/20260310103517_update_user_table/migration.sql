/*
  Warnings:

  - The values [Hotel,retaurant_space] on the enum `PropertyType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `furnished` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `ketchen` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `properties` table. All the data in the column will be lost.
  - The `currency` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `sitting_area` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('seeker', 'owner', 'agent', 'admin');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'pending', 'sold', 'rented', 'off_market', 'coming_soon', 'price_reduced', 'withdrawn', 'leased');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG', 'etc');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED', 'RESCHEDULED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('IN_PERSON', 'VIRTUAL', 'PHONE_CALL');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('WISHLIST', 'FAVORITE', 'SHORTLIST', 'COMPARE', 'FOLLOW');

-- CreateEnum
CREATE TYPE "AmenityCategory" AS ENUM ('INTERIOR', 'EXTERIOR', 'KITCHEN', 'SITTING_AREA', 'BATHROOM', 'BEDROOM', 'SECURITY', 'ACCESSIBILITY', 'TECHNOLOGY', 'FURNISHING', 'PARKING', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RENT_PAYMENT', 'SECURITY_DEPOSIT', 'DEPOSIT_REFUND', 'BUYER_PAYMENT', 'SELLER_RECEIPT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CREDIT_CARD', 'MOBILE_MONEY', 'DIGITAL_WALLET', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('CBE_BIRR', 'TELEBIRR', 'M_PESA', 'COMMERCE_BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('PROPERTY', 'OWNER', 'CUSTOMER', 'AGENCY');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REMOVED', 'SPAM');

-- AlterEnum
BEGIN;
CREATE TYPE "PropertyType_new" AS ENUM ('apartment', 'house', 'office', 'land', 'warehouse', 'hotel', 'restaurant_space', 'shop_space', 'shopping_mall_space', 'factory_space', 'other');
ALTER TABLE "properties" ALTER COLUMN "property_type" TYPE "PropertyType_new" USING ("property_type"::text::"PropertyType_new");
ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
ALTER TYPE "PropertyType_new" RENAME TO "PropertyType";
DROP TYPE "public"."PropertyType_old";
COMMIT;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "furnished",
DROP COLUMN "ketchen",
DROP COLUMN "state",
ADD COLUMN     "kitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationId" UUID,
ADD COLUMN     "sitting_area" INTEGER NOT NULL,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'ETB',
DROP COLUMN "status",
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'available',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'seeker',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropEnum
DROP TYPE "currency";

-- DropEnum
DROP TYPE "role";

-- CreateTable
CREATE TABLE "property_photos" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mediumUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "caption" TEXT,
    "altText" TEXT,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "seekerId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "city" TEXT NOT NULL,
    "subCity" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "seeker_id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "visit_type" "VisitType" NOT NULL DEFAULT 'IN_PERSON',
    "requested_date" TIMESTAMP(6) NOT NULL,
    "requested_time" TEXT NOT NULL,
    "duration_minutes" INTEGER DEFAULT 30,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_date" TIMESTAMP(6),
    "confirmed_time" TEXT,
    "actual_visit_date" TIMESTAMP(6),
    "actual_visit_time" TEXT,
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(6),
    "checked_out_at" TIMESTAMP(6),
    "seeker_phone" TEXT,
    "seeker_email" TEXT,
    "preferred_contact" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_messages" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_feedback" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "feedback_text" TEXT,
    "host_punctuality" INTEGER,
    "property_accuracy" INTEGER,
    "neighborhood_impression" INTEGER,
    "would_recommend" BOOLEAN,
    "follow_up_contacted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_properties" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "favorite_type" "FavoriteType" NOT NULL DEFAULT 'FAVORITE',
    "notify_on_price_change" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_status_change" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_new_photos" BOOLEAN NOT NULL DEFAULT true,
    "last_notified_at" TIMESTAMP(6),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(6),
    "tags" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "favorite_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AmenityCategory" NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_amenities" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "transaction_number" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ETB',
    "description" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentGateway" "PaymentGateway" NOT NULL,
    "gateway_transaction_id" TEXT,
    "gateway_response" JSONB,
    "is_prorated" BOOLEAN NOT NULL DEFAULT false,
    "prorated_days" INTEGER,
    "period_start" TIMESTAMP(6),
    "period_end" TIMESTAMP(6),
    "property_id" UUID,
    "seeker_id" UUID,
    "owner_id" UUID,
    "bookingId" UUID,
    "payee_id" UUID,
    "payment_source_id" UUID,
    "payment_destination_id" UUID,
    "receipt_url" TEXT,
    "refunded_transaction_id" UUID,
    "refund_reason" TEXT,
    "refunded_at" TIMESTAMP(6),
    "receipt_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "receipt_confirmed_at" TIMESTAMP(6),
    "transaction_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_details" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "paymentGateway" "PaymentGateway" NOT NULL,
    "gateway_customer_id" TEXT,
    "gateway_payment_method_id" TEXT,
    "last_four" TEXT,
    "card_brand" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "cardholder_name" TEXT,
    "bank_name" TEXT,
    "account_type" TEXT,
    "routing_number" TEXT,
    "billing_address1" TEXT,
    "billing_address2" TEXT,
    "billing_city" TEXT,
    "billing_state" TEXT,
    "billing_country" TEXT DEFAULT 'ET',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payment_method_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "transaction_id" UUID NOT NULL,
    "receipt_url" TEXT NOT NULL,
    "pdf_url" TEXT,
    "emailed_to" TEXT,
    "emailed_at" TIMESTAMP(6),
    "downloaded_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "review_number" TEXT NOT NULL,
    "type" "ReviewType" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "pros" TEXT,
    "cons" TEXT,
    "author_id" UUID NOT NULL,
    "property_id" UUID,
    "owner_id" UUID,
    "customer_id" UUID,
    "booking_id" UUID,
    "transaction_id" UUID,
    "accuracy_rating" INTEGER,
    "communication_rating" INTEGER,
    "cleanliness_rating" INTEGER,
    "location_rating" INTEGER,
    "value_rating" INTEGER,
    "amenities_rating" INTEGER,
    "responsiveness_rating" INTEGER,
    "fairness_rating" INTEGER,
    "maintenance_rating" INTEGER,
    "payment_reliability" INTEGER,
    "care_of_property" INTEGER,
    "noise_level" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(6),
    "verification_method" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "published_at" TIMESTAMP(6),
    "archived_at" TIMESTAMP(6),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_photos" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" VARCHAR(200),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_videos" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "video_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "title" VARCHAR(200),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_responses" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_helpful" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_reports" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_summaries" (
    "id" UUID NOT NULL,
    "property_id" UUID,
    "owner_id" UUID,
    "customer_id" UUID,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "five_star_count" INTEGER NOT NULL DEFAULT 0,
    "four_star_count" INTEGER NOT NULL DEFAULT 0,
    "three_star_count" INTEGER NOT NULL DEFAULT 0,
    "two_star_count" INTEGER NOT NULL DEFAULT 0,
    "one_star_count" INTEGER NOT NULL DEFAULT 0,
    "avg_accuracy" DOUBLE PRECISION,
    "avg_communication" DOUBLE PRECISION,
    "avg_cleanliness" DOUBLE PRECISION,
    "avg_location" DOUBLE PRECISION,
    "avg_value" DOUBLE PRECISION,
    "last_review_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "review_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_photos_propertyId_idx" ON "property_photos"("propertyId");

-- CreateIndex
CREATE INDEX "property_photos_isPrimary_idx" ON "property_photos"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "property_photos_propertyId_displayOrder_key" ON "property_photos"("propertyId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "property_photos_propertyId_photo_url_key" ON "property_photos"("propertyId", "photo_url");

-- CreateIndex
CREATE INDEX "conversations_propertyId_idx" ON "conversations"("propertyId");

-- CreateIndex
CREATE INDEX "conversations_seekerId_idx" ON "conversations"("seekerId");

-- CreateIndex
CREATE INDEX "conversations_ownerId_idx" ON "conversations"("ownerId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "locations_country_idx" ON "locations"("country");

-- CreateIndex
CREATE INDEX "locations_city_idx" ON "locations"("city");

-- CreateIndex
CREATE INDEX "locations_address_idx" ON "locations"("address");

-- CreateIndex
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "bookings_seeker_id_idx" ON "bookings"("seeker_id");

-- CreateIndex
CREATE INDEX "bookings_host_id_idx" ON "bookings"("host_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_requested_date_idx" ON "bookings"("requested_date");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_property_id_requested_date_requested_time_key" ON "bookings"("property_id", "requested_date", "requested_time");

-- CreateIndex
CREATE INDEX "booking_messages_booking_id_idx" ON "booking_messages"("booking_id");

-- CreateIndex
CREATE INDEX "booking_messages_sender_id_idx" ON "booking_messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_feedback_booking_id_key" ON "booking_feedback"("booking_id");

-- CreateIndex
CREATE INDEX "booking_feedback_booking_id_idx" ON "booking_feedback"("booking_id");

-- CreateIndex
CREATE INDEX "favorite_properties_user_id_idx" ON "favorite_properties"("user_id");

-- CreateIndex
CREATE INDEX "favorite_properties_property_id_idx" ON "favorite_properties"("property_id");

-- CreateIndex
CREATE INDEX "favorite_properties_favorite_type_idx" ON "favorite_properties"("favorite_type");

-- CreateIndex
CREATE INDEX "favorite_properties_created_at_idx" ON "favorite_properties"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_properties_user_id_property_id_key" ON "favorite_properties"("user_id", "property_id");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE INDEX "amenities_category_idx" ON "amenities"("category");

-- CreateIndex
CREATE INDEX "property_amenities_property_id_idx" ON "property_amenities"("property_id");

-- CreateIndex
CREATE INDEX "property_amenities_amenity_id_idx" ON "property_amenities"("amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_amenities_property_id_amenity_id_key" ON "property_amenities"("property_id", "amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_number_key" ON "transactions"("transaction_number");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bookingId_key" ON "transactions"("bookingId");

-- CreateIndex
CREATE INDEX "transactions_transaction_number_idx" ON "transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_seeker_id_idx" ON "transactions"("seeker_id");

-- CreateIndex
CREATE INDEX "transactions_owner_id_idx" ON "transactions"("owner_id");

-- CreateIndex
CREATE INDEX "transactions_property_id_idx" ON "transactions"("property_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "transactions_gateway_transaction_id_idx" ON "transactions"("gateway_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_bookingId_idx" ON "transactions"("bookingId");

-- CreateIndex
CREATE INDEX "payment_method_details_user_id_idx" ON "payment_method_details"("user_id");

-- CreateIndex
CREATE INDEX "payment_method_details_is_default_idx" ON "payment_method_details"("is_default");

-- CreateIndex
CREATE INDEX "payment_method_details_is_active_idx" ON "payment_method_details"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_details_gateway_customer_id_gateway_payment__key" ON "payment_method_details"("gateway_customer_id", "gateway_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_transaction_id_key" ON "receipts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_review_number_key" ON "reviews"("review_number");

-- CreateIndex
CREATE INDEX "reviews_author_id_idx" ON "reviews"("author_id");

-- CreateIndex
CREATE INDEX "reviews_property_id_idx" ON "reviews"("property_id");

-- CreateIndex
CREATE INDEX "reviews_owner_id_idx" ON "reviews"("owner_id");

-- CreateIndex
CREATE INDEX "reviews_customer_id_idx" ON "reviews"("customer_id");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");

-- CreateIndex
CREATE INDEX "reviews_type_idx" ON "reviews"("type");

-- CreateIndex
CREATE INDEX "reviews_is_verified_idx" ON "reviews"("is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_author_id_property_id_key" ON "reviews"("author_id", "property_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_author_id_owner_id_key" ON "reviews"("author_id", "owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_author_id_customer_id_key" ON "reviews"("author_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_author_id_booking_id_key" ON "reviews"("author_id", "booking_id");

-- CreateIndex
CREATE INDEX "review_photos_review_id_idx" ON "review_photos"("review_id");

-- CreateIndex
CREATE INDEX "review_videos_review_id_idx" ON "review_videos"("review_id");

-- CreateIndex
CREATE INDEX "review_responses_review_id_idx" ON "review_responses"("review_id");

-- CreateIndex
CREATE INDEX "review_responses_author_id_idx" ON "review_responses"("author_id");

-- CreateIndex
CREATE INDEX "review_helpful_review_id_idx" ON "review_helpful"("review_id");

-- CreateIndex
CREATE INDEX "review_helpful_user_id_idx" ON "review_helpful"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_review_id_user_id_key" ON "review_helpful"("review_id", "user_id");

-- CreateIndex
CREATE INDEX "review_reports_review_id_idx" ON "review_reports"("review_id");

-- CreateIndex
CREATE INDEX "review_reports_reporter_id_idx" ON "review_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "review_reports_status_idx" ON "review_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "review_reports_review_id_reporter_id_key" ON "review_reports"("review_id", "reporter_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_summaries_property_id_key" ON "review_summaries"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_summaries_owner_id_key" ON "review_summaries"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_summaries_customer_id_key" ON "review_summaries"("customer_id");

-- CreateIndex
CREATE INDEX "review_summaries_property_id_idx" ON "review_summaries"("property_id");

-- CreateIndex
CREATE INDEX "review_summaries_owner_id_idx" ON "review_summaries"("owner_id");

-- CreateIndex
CREATE INDEX "review_summaries_customer_id_idx" ON "review_summaries"("customer_id");

-- CreateIndex
CREATE INDEX "properties_user_id_idx" ON "properties"("user_id");

-- CreateIndex
CREATE INDEX "properties_property_type_idx" ON "properties"("property_type");

-- CreateIndex
CREATE INDEX "properties_purpose_idx" ON "properties"("purpose");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- CreateIndex
CREATE INDEX "properties_created_at_idx" ON "properties"("created_at");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_messages" ADD CONSTRAINT "booking_messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_messages" ADD CONSTRAINT "booking_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_feedback" ADD CONSTRAINT "booking_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_properties" ADD CONSTRAINT "favorite_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_properties" ADD CONSTRAINT "favorite_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_source_id_fkey" FOREIGN KEY ("payment_source_id") REFERENCES "payment_method_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_destination_id_fkey" FOREIGN KEY ("payment_destination_id") REFERENCES "payment_method_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_refunded_transaction_id_fkey" FOREIGN KEY ("refunded_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method_details" ADD CONSTRAINT "payment_method_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_videos" ADD CONSTRAINT "review_videos_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_summaries" ADD CONSTRAINT "review_summaries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_summaries" ADD CONSTRAINT "review_summaries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
