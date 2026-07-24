USE restaurant_db;

CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT UNSIGNED NOT NULL,
  customer_id     INT UNSIGNED DEFAULT NULL,
  order_number    VARCHAR(30) DEFAULT NULL,
  customer_name   VARCHAR(150) DEFAULT NULL,
  customer_phone  VARCHAR(20) DEFAULT NULL,
  order_type      ENUM('dine_in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine_in',
  table_number    VARCHAR(10) DEFAULT NULL,
  status          ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  notes           VARCHAR(500) DEFAULT NULL,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_branch (branch_id),
  KEY idx_orders_customer (customer_id),
  KEY idx_orders_status (status),
  KEY idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id       INT UNSIGNED NOT NULL,
  menu_item_id   INT UNSIGNED NOT NULL,
  item_name      VARCHAR(150) NOT NULL,
  unit_price     DECIMAL(10,2) NOT NULL,
  quantity       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  subtotal       DECIMAL(10,2) NOT NULL,
  notes          VARCHAR(255) DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_menu_item (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
