USE restaurant_db;

ALTER TABLE orders
  ADD COLUMN customer_id INT UNSIGNED DEFAULT NULL AFTER branch_id,
  ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  ADD KEY idx_orders_customer (customer_id);
