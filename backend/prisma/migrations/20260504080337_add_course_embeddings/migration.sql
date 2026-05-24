-- CreateTable
CREATE TABLE "course_embeddings" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "embedded_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_embeddings_course_id_key" ON "course_embeddings"("course_id");

-- CreateIndex
CREATE INDEX "course_embeddings_course_id_idx" ON "course_embeddings"("course_id");

-- AddForeignKey
ALTER TABLE "course_embeddings" ADD CONSTRAINT "course_embeddings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
