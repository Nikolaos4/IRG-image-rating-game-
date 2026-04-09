-- CreateTable
CREATE TABLE "user_tg" (
    "user_id" INTEGER NOT NULL,
    "tg_id" BIGINT NOT NULL,

    CONSTRAINT "user_tg_pkey" PRIMARY KEY ("user_id","tg_id")
);

-- CreateTable
CREATE TABLE "user_tg_confirmation" (
    "user_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "user_tg_confirmation_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "news" (
    "news_id" SERIAL NOT NULL,
    "author_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pkey" PRIMARY KEY ("news_id")
);

-- AddForeignKey
ALTER TABLE "user_tg" ADD CONSTRAINT "user_tg_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tg_confirmation" ADD CONSTRAINT "user_tg_confirmation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
