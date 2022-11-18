/*
  Warnings:

  - You are about to drop the column `paymentId` on the `Balance` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Balance` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_transactionId_fkey";

-- AlterTable
ALTER TABLE "Balance" DROP COLUMN "paymentId",
DROP COLUMN "transactionId";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "balanceId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "balanceId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "Balance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "Balance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
