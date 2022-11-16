/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `CredentialExchange` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CredentialExchange_type_key" ON "CredentialExchange"("type");
