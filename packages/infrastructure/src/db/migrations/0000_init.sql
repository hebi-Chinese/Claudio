CREATE TABLE `bubbles` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`audio_url` text,
	`created_at_ms` integer NOT NULL,
	`played_at_ms` integer
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ts_ms` integer NOT NULL,
	`user_msg` text NOT NULL,
	`dj_reply` text NOT NULL,
	`brain_latency_ms` integer,
	`context_size` integer
);
--> statement-breakpoint
CREATE TABLE `ncm_account` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`cookie` text,
	`user_id` text,
	`user_name` text,
	`vip_type` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`logged_in_at_ms` integer,
	`last_snapshot_at_ms` integer
);
--> statement-breakpoint
CREATE TABLE `ncm_snapshot` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`snapshot_at_ms` integer NOT NULL,
	`raw_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` text NOT NULL,
	`slot_at_ms` integer NOT NULL,
	`song_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`order_idx` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`date_iso` text NOT NULL,
	`created_at_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`song_id` text NOT NULL,
	`played_at_ms` integer NOT NULL,
	`finished` integer NOT NULL,
	`source` text NOT NULL,
	`mood` text,
	`energy` integer
);
--> statement-breakpoint
CREATE TABLE `prefs` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at_ms` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`ncm_id` text NOT NULL,
	`title` text NOT NULL,
	`artists_json` text NOT NULL,
	`album_id` text,
	`album_name` text,
	`cover_url` text,
	`duration_ms` integer NOT NULL,
	`created_at_ms` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `taste_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taken_at_ms` integer NOT NULL,
	`content` text NOT NULL,
	`reason` text
);
