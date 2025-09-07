ALTER TABLE "users" ADD COLUMN "civic_wallet_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_civic_wallet_address_unique" UNIQUE("civic_wallet_address");