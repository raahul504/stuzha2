-- CreateTable
CREATE TABLE "user_recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "learning_path_id" TEXT,
    "course_ids" TEXT[],
    "extracted_goal" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_recommendations_user_id_idx" ON "user_recommendations"("user_id");

-- CreateIndex
CREATE INDEX "user_recommendations_created_at_idx" ON "user_recommendations"("created_at");

-- AddForeignKey
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;
