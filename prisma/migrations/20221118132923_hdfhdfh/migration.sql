/*
  Warnings:

  - You are about to drop the column `balanceId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_balanceId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "balanceId";

-- CreateTable
CREATE TABLE "_BalanceTransactions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BalanceTransactions_AB_unique" ON "_BalanceTransactions"("A", "B");

-- CreateIndex
CREATE INDEX "_BalanceTransactions_B_index" ON "_BalanceTransactions"("B");

-- AddForeignKey
ALTER TABLE "_BalanceTransactions" ADD CONSTRAINT "_BalanceTransactions_A_fkey" FOREIGN KEY ("A") REFERENCES "Balance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BalanceTransactions" ADD CONSTRAINT "_BalanceTransactions_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
