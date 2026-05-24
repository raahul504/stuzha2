-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED_PUBLISH', 'DISAPPROVED_PUBLISH', 'APPROVED_UNPUBLISH', 'DISAPPROVED_UNPUBLISH');

-- CreateTable
CREATE TABLE "course_approval_logs" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "previous_status" "ApprovalStatus" NOT NULL,
    "new_status" "ApprovalStatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_approval_logs_course_id_idx" ON "course_approval_logs"("course_id");

-- CreateIndex
CREATE INDEX "course_approval_logs_admin_id_idx" ON "course_approval_logs"("admin_id");

-- CreateIndex
CREATE INDEX "course_approval_logs_action_idx" ON "course_approval_logs"("action");

-- CreateIndex
CREATE INDEX "course_approval_logs_created_at_idx" ON "course_approval_logs"("created_at");

-- AddForeignKey
ALTER TABLE "course_approval_logs" ADD CONSTRAINT "course_approval_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_approval_logs" ADD CONSTRAINT "course_approval_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
