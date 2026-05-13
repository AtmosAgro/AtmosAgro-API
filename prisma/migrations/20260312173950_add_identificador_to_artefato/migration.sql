/*
  Warnings:

  - A unique constraint covering the columns `[identificador]` on the table `artefatos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "artefatos" ADD COLUMN     "identificador" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "artefatos_identificador_key" ON "artefatos"("identificador");
