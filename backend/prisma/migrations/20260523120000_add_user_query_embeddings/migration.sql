-- CreateTable
CREATE TABLE "user_query_embeddings" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "query_text" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_query_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_query_embeddings_session_token_idx" ON "user_query_embeddings"("session_token");

-- AddForeignKey
ALTER TABLE "user_query_embeddings" ADD CONSTRAINT "user_query_embeddings_session_token_fkey" FOREIGN KEY ("session_token") REFERENCES "conversation_sessions"("session_token") ON DELETE CASCADE ON UPDATE CASCADE;
