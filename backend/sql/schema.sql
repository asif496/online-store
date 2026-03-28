-- Online Store Inventory Database
-- schema.sql

CREATE DATABASE IF NOT EXISTS online_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_store;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  category    VARCHAR(60)  NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  taxRate     DECIMAL(5,4)  NOT NULL DEFAULT 0.05,
  stockQty    INT           NOT NULL DEFAULT 0,
  createdAt   DATETIME      NOT NULL DEFAULT NOW(),
  INDEX idx_category (category)
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  productId    INT NOT NULL,
  customerName VARCHAR(80) NOT NULL,
  rating       TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  createdAt    DATETIME NOT NULL DEFAULT NOW(),
  INDEX idx_productId (productId),
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customerName VARCHAR(80) NOT NULL,
  note         TEXT NULL,
  createdAt    DATETIME NOT NULL DEFAULT NOW(),
  subtotal     DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxTotal     DECIMAL(10,2) NOT NULL DEFAULT 0,
  grandTotal   DECIMAL(10,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  orderId      INT NOT NULL,
  productId    INT NOT NULL,
  qty          INT NOT NULL,
  unitPrice    DECIMAL(10,2) NOT NULL,
  unitTaxRate  DECIMAL(5,4)  NOT NULL,
  lineSubtotal DECIMAL(10,2) NOT NULL,
  lineTax      DECIMAL(10,2) NOT NULL,
  lineTotal    DECIMAL(10,2) NOT NULL,
  INDEX idx_orderId    (orderId),
  INDEX idx_productId  (productId),
  FOREIGN KEY (orderId)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB CHARACTER SET utf8mb4;

-- Product photos table (multi-image upload feature)
CREATE TABLE IF NOT EXISTS product_photos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  productId INT          NOT NULL,
  imageUrl  VARCHAR(255) NOT NULL,
  sortOrder INT          NOT NULL DEFAULT 0,
  createdAt DATETIME     NOT NULL DEFAULT NOW(),
  INDEX idx_pp_productId (productId),
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4;
