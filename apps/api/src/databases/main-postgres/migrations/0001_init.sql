CREATE TYPE "public"."action_status" AS ENUM('pending', 'validating', 'valid', 'invalid', 'error');--> statement-breakpoint
CREATE TYPE "public"."blockchain_network" AS ENUM('arbitrum', 'zetachain');--> statement-breakpoint
CREATE TYPE "public"."parsing_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."quest_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."quest_type" AS ENUM('send', 'receive', 'nft');--> statement-breakpoint
CREATE TABLE "action_validation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"action_id" varchar(255) NOT NULL,
	"action_type" "action_type" NOT NULL,
	"action_data" jsonb NOT NULL,
	"status" "action_status" DEFAULT 'pending' NOT NULL,
	"validated_at" timestamp,
	"validation_error" text,
	"retry_count" bigint DEFAULT 0 NOT NULL,
	"max_retries" bigint DEFAULT 3 NOT NULL,
	"validation_time_ms" bigint
);
--> statement-breakpoint
CREATE TABLE "action_validation_state" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"action_type" "action_type" NOT NULL,
	"last_processed_action_id" varchar(255),
	"last_processed_at" timestamp,
	CONSTRAINT "action_validation_state_actionType_unique" UNIQUE("action_type")
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"bet_id" varchar(255) NOT NULL,
	"game_id" bigint NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"amount" numeric(65, 25) NOT NULL,
	"status" "bet_status" DEFAULT 'active' NOT NULL,
	"block_number" bigint NOT NULL,
	"transaction_hash" varchar(66),
	"network" "blockchain_network" NOT NULL,
	CONSTRAINT "bets_betId_unique" UNIQUE("bet_id")
);
--> statement-breakpoint
CREATE TABLE "block_processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"network" "blockchain_network" NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" varchar(66) NOT NULL,
	"status" "parsing_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"retry_count" bigint DEFAULT 0 NOT NULL,
	"max_retries" bigint DEFAULT 3 NOT NULL,
	"error" text,
	"block_data" jsonb,
	"transactions_processed" bigint DEFAULT 0 NOT NULL,
	"events_processed" bigint DEFAULT 0 NOT NULL,
	"processing_time_ms" bigint
);
--> statement-breakpoint
CREATE TABLE "blockchain_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"network" "blockchain_network" NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" varchar(66) NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"log_index" bigint NOT NULL,
	"address" varchar(42) NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"event_data" jsonb NOT NULL,
	"processed" timestamp,
	"processing_error" text
);
--> statement-breakpoint
CREATE TABLE "blockchain_parser_state" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"network" "blockchain_network" NOT NULL,
	"last_processed_block" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "blockchain_parser_state_network_unique" UNIQUE("network")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"game_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"contract_address" varchar(42) NOT NULL,
	"host_address" varchar(42) NOT NULL,
	"network" "blockchain_network" NOT NULL,
	"min_deposit" numeric(65, 25) NOT NULL,
	"max_deposit" numeric(65, 25) NOT NULL,
	"roi" numeric(5, 2) NOT NULL,
	"fee" numeric(5, 2) NOT NULL,
	"thumbnail_url" text,
	"status" "game_status" DEFAULT 'created' NOT NULL,
	"block_number" bigint NOT NULL,
	CONSTRAINT "games_gameId_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"quest_type" "quest_type" NOT NULL,
	"target" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"quest_status" "quest_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"wallet_address" text NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_validation_jobs_action_id_idx" ON "action_validation_jobs" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "action_validation_jobs_action_type_idx" ON "action_validation_jobs" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "action_validation_jobs_status_idx" ON "action_validation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "action_validation_state_action_type_idx" ON "action_validation_state" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "bets_bet_id_idx" ON "bets" USING btree ("bet_id");--> statement-breakpoint
CREATE INDEX "bets_game_id_idx" ON "bets" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "bets_wallet_address_idx" ON "bets" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "bets_status_idx" ON "bets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bets_network_idx" ON "bets" USING btree ("network");--> statement-breakpoint
CREATE INDEX "block_processing_jobs_network_block_idx" ON "block_processing_jobs" USING btree ("network","block_number");--> statement-breakpoint
CREATE INDEX "block_processing_jobs_status_idx" ON "block_processing_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "block_processing_jobs_block_hash_idx" ON "block_processing_jobs" USING btree ("block_hash");--> statement-breakpoint
CREATE INDEX "blockchain_events_network_block_idx" ON "blockchain_events" USING btree ("network","block_number");--> statement-breakpoint
CREATE INDEX "blockchain_events_address_idx" ON "blockchain_events" USING btree ("address");--> statement-breakpoint
CREATE INDEX "blockchain_events_event_name_idx" ON "blockchain_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "blockchain_events_tx_hash_idx" ON "blockchain_events" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX "blockchain_events_processed_idx" ON "blockchain_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "blockchain_parser_state_network_idx" ON "blockchain_parser_state" USING btree ("network");--> statement-breakpoint
CREATE INDEX "games_game_id_idx" ON "games" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "games_contract_address_idx" ON "games" USING btree ("contract_address");--> statement-breakpoint
CREATE INDEX "games_host_address_idx" ON "games" USING btree ("host_address");--> statement-breakpoint
CREATE INDEX "games_status_idx" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "games_network_idx" ON "games" USING btree ("network");