CREATE TYPE "public"."blockchain_network" AS ENUM('arbitrum', 'zetachain');--> statement-breakpoint
CREATE TYPE "public"."quest_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'CLAIM');--> statement-breakpoint
CREATE TYPE "public"."quest_type" AS ENUM('SEND_ERC20', 'RECEIVE_ERC20', 'SEND_NFT', 'RECEIVE_NFT');--> statement-breakpoint
CREATE TABLE "blockchain_parser_state" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"network" "blockchain_network" NOT NULL,
	"last_processed_block" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "blockchain_parser_state_network_unique" UNIQUE("network")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"quest_type" "quest_type" NOT NULL,
	"reward_amount" bigint NOT NULL,
	"reward_token_address" text NOT NULL,
	"expiry" integer DEFAULT 0 NOT NULL,
	"from_address" text,
	"to_address" text,
	"amount" numeric,
	"token_address" text,
	"nft_address" text
);
--> statement-breakpoint
CREATE TABLE "user_balances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL,
	"balance" numeric(65, 25) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_claims" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
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
CREATE TABLE "user_quests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"quest_status" "quest_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"civic_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	CONSTRAINT "users_civic_id_unique" UNIQUE("civic_id"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_claims" ADD CONSTRAINT "user_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_claims" ADD CONSTRAINT "user_claims_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blockchain_parser_state_network_idx" ON "blockchain_parser_state" USING btree ("network");