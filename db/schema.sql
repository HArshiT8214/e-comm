-- HP Printer E-commerce Database Schema (MySQL 8.0)
-- Safe (re)creation
DROP DATABASE IF EXISTS hp_printer_shop;
CREATE DATABASE hp_printer_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE hp_printer_shop;

-- Domain enums (as CHECK constraints for MySQL 8.0)
-- Note: MySQL prior to 8.0.16 ignores CHECK; on such versions use ENUMs instead

-- Users
CREATE TABLE users (
  user_id           INT AUTO_INCREMENT PRIMARY KEY,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  phone             VARCHAR(20),
  role              ENUM('customer','admin','support') NOT NULL DEFAULT 'customer',
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

-- Addresses
CREATE TABLE addresses (
  address_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  line1             VARCHAR(255) NOT NULL,
  line2             VARCHAR(255),
  city              VARCHAR(100) NOT NULL,
  state             VARCHAR(100) NOT NULL,
  zipcode           VARCHAR(20) NOT NULL,
  country           VARCHAR(100) NOT NULL,
  is_default        TINYINT(1) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Categories (self-referencing for hierarchy)
CREATE TABLE categories (
  category_id       INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  parent_id         INT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(category_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_categories_name_parent (name, parent_id)
) ENGINE=InnoDB;

-- Products
CREATE TABLE products (
  product_id        INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  category_id       INT NOT NULL,
  brand             VARCHAR(100) NOT NULL DEFAULT 'HP',
  price             DECIMAL(10,2) NOT NULL,
  stock_quantity    INT NOT NULL DEFAULT 0,
  sku               VARCHAR(50) NOT NULL,
  image_url         VARCHAR(255),
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_products_sku (sku),
  KEY idx_products_category (category_id)
) ENGINE=InnoDB;

-- Product images (multiple images per product)
CREATE TABLE product_images (
  image_id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id        INT NOT NULL,
  url               VARCHAR(255) NOT NULL,
  alt_text          VARCHAR(200),
  display_order     INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  KEY idx_product_images_product (product_id, display_order)
) ENGINE=InnoDB;

-- Inventory movements (auditable stock changes)
CREATE TABLE inventory_movements (
  movement_id       INT AUTO_INCREMENT PRIMARY KEY,
  product_id        INT NOT NULL,
  delta_quantity    INT NOT NULL,
  reason            ENUM('order','restock','adjustment','refund','return') NOT NULL,
  reference_type    VARCHAR(50),
  reference_id      INT,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  KEY idx_inventory_product (product_id)
) ENGINE=InnoDB;

-- Carts
CREATE TABLE carts (
  cart_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_carts_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  cart_item_id      INT AUTO_INCREMENT PRIMARY KEY,
  cart_id           INT NOT NULL,
  product_id        INT NOT NULL,
  quantity          INT NOT NULL CHECK (quantity > 0),
  unit_price        DECIMAL(10,2) NOT NULL,
  added_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_cart_items_cart_product (cart_id, product_id)
) ENGINE=InnoDB;

-- Wishlists (optional)
CREATE TABLE wishlists (
  wishlist_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  name              VARCHAR(100) NOT NULL DEFAULT 'Default',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wishlist_items (
  wishlist_item_id  INT AUTO_INCREMENT PRIMARY KEY,
  wishlist_id       INT NOT NULL,
  product_id        INT NOT NULL,
  added_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlist_items_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists(wishlist_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_wishlist_items (wishlist_id, product_id)
) ENGINE=InnoDB;

-- Coupons (basic)
CREATE TABLE coupons (
  coupon_id         INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(40) NOT NULL,
  description       VARCHAR(255),
  discount_type     ENUM('percent','amount') NOT NULL,
  discount_value    DECIMAL(10,2) NOT NULL,
  max_uses          INT,
  used_count        INT NOT NULL DEFAULT 0,
  valid_from        DATETIME,
  valid_to          DATETIME,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_coupons_code (code)
) ENGINE=InnoDB;

-- Orders
CREATE TABLE orders (
  order_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  status            ENUM('pending','paid','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_id        INT NULL,
  shipping_address_id INT NULL,
  billing_address_id  INT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orders_shipping_address FOREIGN KEY (shipping_address_id) REFERENCES addresses(address_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orders_billing_address FOREIGN KEY (billing_address_id) REFERENCES addresses(address_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  KEY idx_orders_user (user_id)
) ENGINE=InnoDB;

-- Order coupons mapping
CREATE TABLE order_coupons (
  order_coupon_id   INT AUTO_INCREMENT PRIMARY KEY,
  order_id          INT NOT NULL,
  coupon_id         INT NOT NULL,
  discount_applied  DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_coupons_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uk_order_coupon (order_id, coupon_id)
) ENGINE=InnoDB;

-- Order Items
CREATE TABLE order_items (
  order_item_id     INT AUTO_INCREMENT PRIMARY KEY,
  order_id          INT NOT NULL,
  product_id        INT NOT NULL,
  quantity          INT NOT NULL CHECK (quantity > 0),
  unit_price        DECIMAL(10,2) NOT NULL,
  subtotal          DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- Payments
CREATE TABLE payments (
  payment_id        INT AUTO_INCREMENT PRIMARY KEY,
  order_id          INT NOT NULL,
  method            ENUM('credit_card','upi','paypal','cod') NOT NULL,
  status            ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_id    VARCHAR(100),
  amount            DECIMAL(10,2) NOT NULL,
  paid_at           TIMESTAMP NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_payments_txn (transaction_id)
) ENGINE=InnoDB;

-- Shipping
CREATE TABLE shipping (
  shipping_id       INT AUTO_INCREMENT PRIMARY KEY,
  order_id          INT NOT NULL,
  carrier           VARCHAR(100) NOT NULL,
  tracking_number   VARCHAR(100),
  status            ENUM('in_transit','delivered','returned') NOT NULL DEFAULT 'in_transit',
  shipped_at        TIMESTAMP NULL,
  delivered_at      TIMESTAMP NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipping_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_shipping_order (order_id)
) ENGINE=InnoDB;

-- Reviews
CREATE TABLE reviews (
  review_id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  product_id        INT NOT NULL,
  rating            INT NOT NULL,
  comment           TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_reviews_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- Support tickets
CREATE TABLE support_tickets (
  ticket_id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  subject           VARCHAR(200) NOT NULL,
  description       TEXT,
  status            ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Helpful views
CREATE OR REPLACE VIEW v_product_inventory AS
SELECT p.product_id,
       p.name,
       p.sku,
       p.stock_quantity,
       COALESCE(SUM(CASE WHEN im.reason IN ('order') THEN -im.delta_quantity ELSE im.delta_quantity END), 0) AS net_movement
FROM products p
LEFT JOIN inventory_movements im ON im.product_id = p.product_id
GROUP BY p.product_id, p.name, p.sku, p.stock_quantity;

-- Seed minimal data (brands implied by default)
INSERT INTO categories (name, parent_id) VALUES
  ('Printers', NULL),
  ('Ink & Toner', NULL),
  ('Accessories', NULL); 