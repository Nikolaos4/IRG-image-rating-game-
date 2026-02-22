-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_rating" (
    "user_id" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,

    CONSTRAINT "user_rating_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_ban" (
    "user_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "banned_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ban_pkey" PRIMARY KEY ("user_id","banned_by")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "image" (
    "image_id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "criteria_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("criteria_id")
);

-- CreateTable
CREATE TABLE "image_rating" (
    "image_id" INTEGER NOT NULL,
    "criteria_id" INTEGER NOT NULL,
    "votes" INTEGER NOT NULL,

    CONSTRAINT "image_rating_pkey" PRIMARY KEY ("image_id","criteria_id")
);

-- CreateTable
CREATE TABLE "game" (
    "game_id" SERIAL NOT NULL,
    "criteria_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "invite_token" TEXT NOT NULL,
    "current_round" INTEGER NOT NULL,
    "max_round" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("game_id")
);

-- CreateTable
CREATE TABLE "game_member" (
    "game_member_id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "game_member_pkey" PRIMARY KEY ("game_member_id")
);

-- CreateTable
CREATE TABLE "game_image" (
    "game_image_id" SERIAL NOT NULL,
    "image_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "game_image_pkey" PRIMARY KEY ("game_image_id")
);

-- CreateTable
CREATE TABLE "round" (
    "round_id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "first_image" INTEGER NOT NULL,
    "second_image" INTEGER NOT NULL,

    CONSTRAINT "round_pkey" PRIMARY KEY ("round_id")
);

-- CreateTable
CREATE TABLE "vote" (
    "vote_id" SERIAL NOT NULL,
    "round_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "voted_image_id" INTEGER NOT NULL,

    CONSTRAINT "vote_pkey" PRIMARY KEY ("vote_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "game_invite_token_key" ON "game"("invite_token");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rating" ADD CONSTRAINT "user_rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ban" ADD CONSTRAINT "user_ban_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ban" ADD CONSTRAINT "user_ban_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_rating" ADD CONSTRAINT "image_rating_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_rating" ADD CONSTRAINT "image_rating_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("criteria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("criteria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_member" ADD CONSTRAINT "game_member_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_member" ADD CONSTRAINT "game_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_image" ADD CONSTRAINT "game_image_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_image" ADD CONSTRAINT "game_image_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_first_image_fkey" FOREIGN KEY ("first_image") REFERENCES "image"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_second_image_fkey" FOREIGN KEY ("second_image") REFERENCES "image"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "round"("round_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_voted_image_id_fkey" FOREIGN KEY ("voted_image_id") REFERENCES "image"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;
