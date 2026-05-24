/*
  Warnings:

  - You are about to drop the column `category_id` on the `courses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_category_id_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "category_id";

-- CreateTable
CREATE TABLE "course_categories" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_categories_course_id_idx" ON "course_categories"("course_id");

-- CreateIndex
CREATE INDEX "course_categories_category_id_idx" ON "course_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_course_id_category_id_key" ON "course_categories"("course_id", "category_id");

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
