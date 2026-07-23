USE restaurant_db;

CREATE TABLE IF NOT EXISTS staff (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT UNSIGNED DEFAULT NULL,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_email (email),
  CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL,
  KEY idx_staff_branch (branch_id),
  KEY idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
