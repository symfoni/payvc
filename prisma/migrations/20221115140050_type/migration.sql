/*
  Warnings:

  - You are about to drop the column `credentialOfferId` on the `Requsition` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Requsition" DROP CONSTRAINT "Requsition_credentialOfferId_fkey";

-- AlterTable
ALTER TABLE "CredentialOffer" ADD COLUMN     "credentialTypeId" TEXT;

-- AlterTable
ALTER TABLE "Requsition" DROP COLUMN "credentialOfferId",
ADD COLUMN     "credentialTypeId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "credentialOfferId" TEXT;

-- CreateTable
CREATE TABLE "CredentialType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "CredentialType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CredentialType_name_key" ON "CredentialType"("name");

-- AddForeignKey
ALTER TABLE "CredentialOffer" ADD CONSTRAINT "CredentialOffer_credentialTypeId_fkey" FOREIGN KEY ("credentialTypeId") REFERENCES "CredentialType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requsition" ADD CONSTRAINT "Requsition_credentialTypeId_fkey" FOREIGN KEY ("credentialTypeId") REFERENCES "CredentialType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_credentialOfferId_fkey" FOREIGN KEY ("credentialOfferId") REFERENCES "CredentialOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
