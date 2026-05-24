-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "order_index" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalKeywords" TEXT[],
    "difficultyLevel" TEXT NOT NULL,
    "estimated_months" INTEGER,
    "required_category_ids" TEXT[],
    "preferences_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_token" TEXT NOT NULL,
    "messages_json" JSONB[],
    "extracted_goal" TEXT,
    "extracted_preferences" JSONB,
    "recommended_path_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_sessions_session_token_key" ON "conversation_sessions"("session_token");

-- CreateIndex
CREATE INDEX "conversation_sessions_user_id_idx" ON "conversation_sessions"("user_id");

-- CreateIndex
CREATE INDEX "conversation_sessions_session_token_idx" ON "conversation_sessions"("session_token");

-- CreateIndex
CREATE INDEX "categories_level_idx" ON "categories"("level");
