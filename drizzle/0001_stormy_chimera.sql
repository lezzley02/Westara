CREATE TABLE `favorite_stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`station_key` varchar(160) NOT NULL,
	`name` varchar(180) NOT NULL,
	`address` varchar(500) NOT NULL,
	`connector_types` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_stations_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorite_station_owner_key` UNIQUE(`user_id`,`station_key`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`request_id` int,
	`rating` int NOT NULL,
	`body` text,
	`admin_reply` text,
	`replied_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`request_id` int,
	`kind` enum('request_reply','status_update','feedback_reply','general') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` varchar(500) NOT NULL,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`sender_user_id` int NOT NULL,
	`sender_role` enum('customer','admin') NOT NULL,
	`body` text NOT NULL,
	`customer_visible` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `request_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`admin_user_id` int NOT NULL,
	`body` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `request_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_status_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`request_id` int NOT NULL,
	`actor_user_id` int NOT NULL,
	`from_status` varchar(32),
	`to_status` enum('new','pending','assigned','in_progress','completed','cancelled') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `request_status_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_journeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`origin` varchar(240) NOT NULL,
	`destination` varchar(240) NOT NULL,
	`distance_km` double,
	`duration_minutes` int,
	`charging_stops` json,
	`estimate_source` varchar(80) NOT NULL DEFAULT 'not available',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_journeys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(24) NOT NULL,
	`user_id` int NOT NULL,
	`vehicle_id` int,
	`kind` enum('roadside','rental','maintenance') NOT NULL,
	`category` varchar(80) NOT NULL,
	`summary` varchar(180) NOT NULL,
	`status` enum('new','pending','assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`details` json,
	`location_text` varchar(500),
	`latitude` double,
	`longitude` double,
	`location_consent` boolean NOT NULL DEFAULT false,
	`estimated_price_inr` int,
	`assigned_team_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_requests_public_id_unique` UNIQUE(`public_id`)
);
--> statement-breakpoint
CREATE TABLE `service_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(120) NOT NULL,
	`value` text NOT NULL,
	`updated_by_user_id` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_settings_setting_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nickname` varchar(80),
	`make` varchar(80) NOT NULL DEFAULT 'Tesla',
	`model` varchar(100) NOT NULL,
	`year` int,
	`registration` varchar(32),
	`archived_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `preferences` json;--> statement-breakpoint
ALTER TABLE `favorite_stations` ADD CONSTRAINT `favorite_stations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_request_id_service_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_request_id_service_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_messages` ADD CONSTRAINT `request_messages_request_id_service_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_messages` ADD CONSTRAINT `request_messages_sender_user_id_users_id_fk` FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_notes` ADD CONSTRAINT `request_notes_request_id_service_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_notes` ADD CONSTRAINT `request_notes_admin_user_id_users_id_fk` FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_status_events` ADD CONSTRAINT `request_status_events_request_id_service_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `request_status_events` ADD CONSTRAINT `request_status_events_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_journeys` ADD CONSTRAINT `saved_journeys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_vehicle_id_vehicles_id_fk` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_assigned_team_id_team_members_id_fk` FOREIGN KEY (`assigned_team_id`) REFERENCES `team_members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_settings` ADD CONSTRAINT `service_settings_updated_by_user_id_users_id_fk` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `favorite_stations_user_idx` ON `favorite_stations` (`user_id`);--> statement-breakpoint
CREATE INDEX `feedback_created_idx` ON `feedback` (`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `request_messages_request_idx` ON `request_messages` (`request_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `request_notes_request_idx` ON `request_notes` (`request_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `request_status_events_request_idx` ON `request_status_events` (`request_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `saved_journeys_user_idx` ON `saved_journeys` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `service_requests_user_idx` ON `service_requests` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `service_requests_status_idx` ON `service_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `service_requests_kind_idx` ON `service_requests` (`kind`,`created_at`);--> statement-breakpoint
CREATE INDEX `vehicles_user_idx` ON `vehicles` (`user_id`);