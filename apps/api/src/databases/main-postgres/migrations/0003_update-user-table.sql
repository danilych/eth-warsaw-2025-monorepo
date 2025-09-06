ALTER TABLE "quests" RENAME COLUMN "reward" TO "reward_amount";--> statement-breakpoint
ALTER TABLE "quests" RENAME COLUMN "target" TO "reward_token_address";--> statement-breakpoint
ALTER TABLE "quests" ALTER COLUMN "token_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "from_address" text;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "to_address" text;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "amount" numeric;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "nft_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "civic_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_civic_id_unique" UNIQUE("civic_id");--> statement-breakpoint
ALTER TABLE "public"."quests" ALTER COLUMN "quest_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."quest_type";--> statement-breakpoint
CREATE TYPE "public"."quest_type" AS ENUM('SEND_ERC20', 'RECEIVE_ERC20', 'SEND_NFT', 'RECEIVE_NFT');--> statement-breakpoint
ALTER TABLE "public"."quests" ALTER COLUMN "quest_type" SET DATA TYPE "public"."quest_type" USING "quest_type"::"public"."quest_type";