-- =======================================================================
-- SMARTGOV QUEUE — DATABASE SCHEMA DEFINITION (MySQL / TiDB Cloud DDL)
-- Target: TiDB Cloud Serverless / MySQL 8.0 Compatible
-- =======================================================================

-- 1. USERS & AUTHENTICATION TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('citizen', 'staff', 'admin') NOT NULL DEFAULT 'citizen',
  `national_id` VARCHAR(50) NULL, -- Citizen identification number
  `staff_id` VARCHAR(50) NULL,    -- Official Government employee registration code
  `office_id` VARCHAR(64) NULL,   -- Assigned office for staff
  `assigned_counter_id` VARCHAR(64) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_office` (`office_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. GOVERNMENT OFFICES TABLE
CREATE TABLE IF NOT EXISTS `government_offices` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE, -- e.g. CMC, REV, SWD, CSH
  `department` VARCHAR(200) NOT NULL,
  `address` TEXT NOT NULL,
  `operating_hours` VARCHAR(100) NOT NULL,
  `contact_number` VARCHAR(50) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. GOVERNMENT SERVICES TABLE
CREATE TABLE IF NOT EXISTS `government_services` (
  `id` VARCHAR(64) PRIMARY KEY,
  `office_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(20) NOT NULL, -- e.g. CERT, TAX, TRADE, PEN
  `category` VARCHAR(100) NOT NULL,
  `avg_duration_minutes` INT NOT NULL DEFAULT 10,
  `required_documents` JSON NULL, -- Array of required documents
  `fee_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`office_id`) REFERENCES `government_offices`(`id`) ON DELETE CASCADE,
  INDEX `idx_services_office` (`office_id`),
  INDEX `idx_services_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. SERVICE COUNTERS TABLE
CREATE TABLE IF NOT EXISTS `service_counters` (
  `id` VARCHAR(64) PRIMARY KEY,
  `office_id` VARCHAR(64) NOT NULL,
  `counter_number` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `service_ids` JSON NOT NULL, -- List of serviced IDs allocated to this desk
  `current_staff_id` VARCHAR(64) NULL,
  `status` ENUM('active', 'break', 'closed') NOT NULL DEFAULT 'active',
  `current_token_id` VARCHAR(64) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`office_id`) REFERENCES `government_offices`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_office_counter` (`office_id`, `counter_number`),
  INDEX `idx_counters_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. DIGITAL TOKENS TABLE (CORE QUEUE ENGINE)
CREATE TABLE IF NOT EXISTS `digital_tokens` (
  `id` VARCHAR(64) PRIMARY KEY,
  `token_number` VARCHAR(30) NOT NULL, -- Formatted: CODE-SEQUENCE (e.g. CERT-101)
  `sequence_number` INT NOT NULL,
  `office_id` VARCHAR(64) NOT NULL,
  `service_id` VARCHAR(64) NOT NULL,
  `citizen_id` VARCHAR(64) NOT NULL,
  `citizen_name` VARCHAR(150) NOT NULL,
  `citizen_phone` VARCHAR(30) NOT NULL,
  `citizen_national_id` VARCHAR(50) NOT NULL,
  `counter_id` VARCHAR(64) NULL,
  `counter_number` INT NULL,
  `staff_id` VARCHAR(64) NULL,
  `status` ENUM('WAITING', 'SERVING', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'WAITING',
  `priority` ENUM('STANDARD', 'SENIOR_CITIZEN', 'SPECIALLY_ABLED') NOT NULL DEFAULT 'STANDARD',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `called_at` TIMESTAMP NULL,
  `served_at` TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  `skipped_at` TIMESTAMP NULL,
  `skip_reason` VARCHAR(255) NULL,
  `estimated_wait_minutes` INT NOT NULL DEFAULT 15,
  `notes` TEXT NULL,
  `qr_payload` VARCHAR(255) NULL,
  `ocr_processed` BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (`office_id`) REFERENCES `government_offices`(`id`),
  FOREIGN KEY (`service_id`) REFERENCES `government_services`(`id`),
  INDEX `idx_tokens_office_status` (`office_id`, `status`),
  INDEX `idx_tokens_citizen` (`citizen_id`),
  INDEX `idx_tokens_status_created` (`status`, `created_at`),
  INDEX `idx_token_number` (`token_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. QUEUE AUDIT EVENTS & TIMELINE
CREATE TABLE IF NOT EXISTS `queue_events` (
  `id` VARCHAR(64) PRIMARY KEY,
  `token_id` VARCHAR(64) NOT NULL,
  `token_number` VARCHAR(30) NOT NULL,
  `office_id` VARCHAR(64) NOT NULL,
  `event_type` ENUM('GENERATED', 'CALLED', 'SERVING_STARTED', 'COMPLETED', 'SKIPPED') NOT NULL,
  `counter_number` INT NULL,
  `performed_by_id` VARCHAR(64) NOT NULL,
  `performed_by_name` VARCHAR(150) NOT NULL,
  `details` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_events_token` (`token_id`),
  INDEX `idx_events_office_time` (`office_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `in_app_notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `token_id` VARCHAR(64) NOT NULL,
  `token_number` VARCHAR(30) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'warning', 'success', 'alert') NOT NULL DEFAULT 'info',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
