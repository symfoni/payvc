/*
  Warnings:

  - A unique constraint covering the columns `[currency,businessId]` on the table `Balance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Balance_currency_businessId_key" ON "Balance"("currency", "businessId");
