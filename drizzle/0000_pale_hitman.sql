CREATE TABLE `alert_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`metric` text NOT NULL,
	`operator` text NOT NULL,
	`threshold` real NOT NULL,
	`unit` text NOT NULL,
	`severity` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_alert_rules_enabled` ON `alert_rules` (`enabled`);--> statement-breakpoint
CREATE TABLE `app_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`chain` text NOT NULL,
	`price` real NOT NULL,
	`change_24h` real NOT NULL,
	`total_deposits` real NOT NULL,
	`total_borrows` real NOT NULL,
	`bad_debt` real NOT NULL,
	`risk_score` integer NOT NULL,
	`status` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_markets_symbol` ON `markets` (`symbol`);--> statement-breakpoint
CREATE INDEX `idx_markets_status_risk` ON `markets` (`status`,`risk_score`);--> statement-breakpoint
CREATE TABLE `portfolio_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`captured_at` text NOT NULL,
	`total_deposits` real NOT NULL,
	`total_borrows` real NOT NULL,
	`revenue` real NOT NULL,
	`health_score` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_snapshots_captured_at` ON `portfolio_snapshots` (`captured_at`);--> statement-breakpoint
CREATE TABLE `risk_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`market_id` integer,
	`event_type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`occurred_at` text NOT NULL,
	`acknowledged_at` text,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_risk_events_status_time` ON `risk_events` (`status`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_risk_events_severity_time` ON `risk_events` (`severity`,`occurred_at`);