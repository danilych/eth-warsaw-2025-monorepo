CREATE TABLE "user_balances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL,
	"balance" numeric(65, 25) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_claims" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"claim_amount" numeric(65, 25) NOT NULL,
	"claim_token_address" text NOT NULL,
	"claim_timestamp" bigint NOT NULL,
	"claim_transaction_hash" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_claims" ADD CONSTRAINT "user_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_claims" ADD CONSTRAINT "user_claims_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."user_quests" ALTER COLUMN "quest_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."quest_status";--> statement-breakpoint
CREATE TYPE "public"."quest_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'CLAIM');--> statement-breakpoint
ALTER TABLE "public"."user_quests" ALTER COLUMN "quest_status" SET DATA TYPE "public"."quest_status" USING "quest_status"::"public"."quest_status";