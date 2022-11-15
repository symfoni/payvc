/*
  Warnings:

  - A unique constraint covering the columns `[apikey]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "apikey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_apikey_key" ON "Business"("apikey");
