CREATE TABLE `automation_agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`mission` text NOT NULL,
	`scope` text NOT NULL,
	`status` text NOT NULL,
	`success_rate` real NOT NULL,
	`runs_24h` integer NOT NULL,
	`median_latency_ms` integer NOT NULL,
	`last_run_at` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_automation_agents_status` ON `automation_agents` (`status`,`enabled`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`last_active_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_team_members_email` ON `team_members` (`email`);--> statement-breakpoint
CREATE INDEX `idx_team_members_role_status` ON `team_members` (`role`,`status`);