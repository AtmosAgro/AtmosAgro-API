-- CreateTable
CREATE TABLE "scene_catalog" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "propriedade_id" UUID NOT NULL,
    "data_cena" DATE NOT NULL,
    "cloud_cover" DECIMAL(5,2),
    "product_id" VARCHAR(100),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "scene_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_catalog_fetch" (
    "propriedade_id" UUID NOT NULL,
    "mes" DATE NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "scene_catalog_fetch_pkey" PRIMARY KEY ("propriedade_id", "mes")
);

-- CreateIndex
CREATE UNIQUE INDEX "scene_catalog_propriedade_id_data_cena_key" ON "scene_catalog"("propriedade_id", "data_cena");

-- CreateIndex
CREATE INDEX "scene_catalog_propriedade_id_data_cena_idx" ON "scene_catalog"("propriedade_id", "data_cena");

-- AddForeignKey
ALTER TABLE "scene_catalog" ADD CONSTRAINT "scene_catalog_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "scene_catalog_fetch" ADD CONSTRAINT "scene_catalog_fetch_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
