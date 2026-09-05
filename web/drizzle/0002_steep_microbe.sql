CREATE TABLE `activity_chats` (
	`owner` text PRIMARY KEY NOT NULL,
	`chat` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`lock_token` text NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_usage_owner_window` ON `ai_usage` (`owner`,`window`);