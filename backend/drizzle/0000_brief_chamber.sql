CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`section` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`device` text NOT NULL,
	`created` integer NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`lead` text NOT NULL,
	`reference` text NOT NULL,
	`status` text DEFAULT 'Brouillon' NOT NULL,
	`price` real NOT NULL,
	`quantity` integer NOT NULL,
	`tax` real,
	`created` integer NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_reference_unique` ON `invoices` (`reference`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`address` text NOT NULL,
	`quantity` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Nouveau' NOT NULL,
	`created` integer NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_session_unique` ON `leads` (`session`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`started` integer NOT NULL,
	`seen` integer NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`form_viewed` integer DEFAULT 0 NOT NULL,
	`form_started` integer DEFAULT 0 NOT NULL,
	`submitted` integer DEFAULT 0 NOT NULL,
	`cta` integer DEFAULT 0 NOT NULL,
	`device` text NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
