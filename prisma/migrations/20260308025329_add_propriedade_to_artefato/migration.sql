-- AlterTable
ALTER TABLE "artefatos" ADD COLUMN     "propriedade_id" UUID;

-- AddForeignKey
ALTER TABLE "artefatos" ADD CONSTRAINT "artefatos_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
