CREATE DATABASE IF NOT EXISTS restaurant_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_db;

CREATE TABLE IF NOT EXISTS branches (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  code              VARCHAR(20)  NOT NULL,
  address           VARCHAR(255) NOT NULL,
  city              VARCHAR(100) NOT NULL,
  state             VARCHAR(100) DEFAULT NULL,
  country           VARCHAR(100) NOT NULL DEFAULT 'Sri Lanka',
  postal_code       VARCHAR(20)  DEFAULT NULL,
  phone             VARCHAR(20)  NOT NULL,
  email             VARCHAR(150) DEFAULT NULL,
  manager_name      VARCHAR(150) DEFAULT NULL,
  opening_time      TIME DEFAULT NULL,
  closing_time      TIME DEFAULT NULL,
  seating_capacity  SMALLINT UNSIGNED DEFAULT NULL,
  latitude          DECIMAL(10,8) DEFAULT NULL,
  longitude         DECIMAL(11,8) DEFAULT NULL,
  status            ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branches_code (code),
  KEY idx_branches_city (city),
  KEY idx_branches_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
