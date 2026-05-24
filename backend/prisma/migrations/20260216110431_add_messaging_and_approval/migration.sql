-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING_PUBLISH', 'PUBLISHED', 'PENDING_UNPUBLISH');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('USER_TO_INSTRUCTOR', 'INSTRUCTOR_TO_USER', 'ADMIN_TO_INSTRUCTOR', 'ADMIN_TO_USER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COURSE_PUBLISH_APPROVED', 'COURSE_PUBLISH_DISAPPROVED', 'COURSE_UNPUBLISH_APPROVED', 'COURSE_UNPUBLISH_DISAPPROVED', 'NEW_USER_QUESTION', 'INSTRUCTOR_REPLY', 'ADMIN_MESSAGE');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "approval_message" TEXT,
ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "course_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "parent_message_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_entity_id" TEXT,
    "related_entity_type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_course_id_idx" ON "messages"("course_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_recipient_id_idx" ON "messages"("recipient_id");

-- CreateIndex
CREATE INDEX "messages_parent_message_id_idx" ON "messages"("parent_message_id");

-- CreateIndex
CREATE INDEX "messages_is_read_idx" ON "messages"("is_read");

-- CreateIndex
CREATE INDEX "messages_message_type_idx" ON "messages"("message_type");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_notification_type_idx" ON "notifications"("notification_type");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
