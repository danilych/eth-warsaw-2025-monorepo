ALTER TABLE "quests" ADD COLUMN "reward" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "token_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "expiry" integer DEFAULT 0 NOT NULL;