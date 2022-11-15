/*
  Warnings:

  - A unique constraint covering the columns `[did]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Business_did_key" ON "Business"("did");
