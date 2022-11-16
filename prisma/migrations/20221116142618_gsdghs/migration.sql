/*
  Warnings:

  - You are about to drop the `_BusinessToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BusinessToUser" DROP CONSTRAINT "_BusinessToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_BusinessToUser" DROP CONSTRAINT "_BusinessToUser_B_fkey";

-- DropTable
DROP TABLE "_BusinessToUser";

-- CreateTable
CREATE TABLE "_AllBusinesses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AllBusinesses_AB_unique" ON "_AllBusinesses"("A", "B");

-- CreateIndex
CREATE INDEX "_AllBusinesses_B_index" ON "_AllBusinesses"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedBusinessId_fkey" FOREIGN KEY ("selectedBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllBusinesses" ADD CONSTRAINT "_AllBusinesses_A_fkey" FOREIGN KEY ("A") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AllBusinesses" ADD CONSTRAINT "_AllBusinesses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
