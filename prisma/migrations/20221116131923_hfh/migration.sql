/*
  Warnings:

  - Added the required column `credentialExchangeId` to the `CredentialOffer` table without a default value. This is not possible if the table is not empty.
  - Made the column `credentialTypeId` on table `CredentialOffer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `credentialTypeId` on table `Requsition` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `requisitionStatus` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionRequsitionStatus" AS ENUM ('NEW', 'REQUESTED_BY_USER', 'REQUESTED_BY_WALLET', 'VALIDATEDBYISSUER', 'VALIDATEDBYWALLET', 'VALIDATED', 'FULLFILLED');

-- CreateEnum
CREATE TYPE "ExchangeType" AS ENUM ('WEB');

-- DropForeignKey
ALTER TABLE "CredentialOffer" DROP CONSTRAINT "CredentialOffer_credentialTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Requsition" DROP CONSTRAINT "Requsition_credentialTypeId_fkey";

-- AlterTable
ALTER TABLE "CredentialOffer" ADD COLUMN     "credentialExchangeId" TEXT NOT NULL,
ALTER COLUMN "credentialTypeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Requsition" ALTER COLUMN "credentialTypeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "requisitionStatus",
ADD COLUMN     "requisitionStatus" "TransactionRequsitionStatus" NOT NULL;

-- DropEnum
DROP TYPE "RequsitionStatus";

-- CreateTable
CREATE TABLE "CredentialExchange" (
    "id" TEXT NOT NULL,
    "type" "ExchangeType" NOT NULL DEFAULT 'WEB',

    CONSTRAINT "CredentialExchange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CredentialOffer" ADD CONSTRAINT "CredentialOffer_credentialTypeId_fkey" FOREIGN KEY ("credentialTypeId") REFERENCES "CredentialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialOffer" ADD CONSTRAINT "CredentialOffer_credentialExchangeId_fkey" FOREIGN KEY ("credentialExchangeId") REFERENCES "CredentialExchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requsition" ADD CONSTRAINT "Requsition_credentialTypeId_fkey" FOREIGN KEY ("credentialTypeId") REFERENCES "CredentialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
