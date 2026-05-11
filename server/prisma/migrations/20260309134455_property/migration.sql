/*
  Warnings:

  - Made the column `first_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'office', 'land', 'warehouse', 'Hotel', 'retaurant_space', 'shop_space', 'shopping_mall_space', 'factory_space', 'other');

-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('sale', 'rent', 'lease', 'short_term_rental', 'long_term_rental', 'other');

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('ETB', 'KES', 'UGX', 'SOS', 'NGN', 'USD', 'SSP', 'SDG', 'etc');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "currency" NOT NULL DEFAULT 'ETB',
    "property_type" "PropertyType" NOT NULL,
    "purpose" "Purpose" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "bedrooms" INTEGER NOT NULL,
    "ketchen" BOOLEAN NOT NULL DEFAULT false,
    "bathrooms" INTEGER NOT NULL,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);
