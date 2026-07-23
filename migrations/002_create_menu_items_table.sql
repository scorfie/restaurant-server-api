USE restaurant_db;

CREATE TABLE IF NOT EXISTS menu_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  description   VARCHAR(500) DEFAULT NULL,
  price         DECIMAL(10,2) NOT NULL,
  category      VARCHAR(100) DEFAULT NULL,
  is_available  TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_items_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
  KEY idx_menu_items_branch (branch_id),
  KEY idx_menu_items_category (category),
  KEY idx_menu_items_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
