-- sql/add_photos_table.sql
-- Run this AFTER schema.sql if upgrading an existing install
-- (schema.sql already contains this table for fresh installs)

USE online_store;

CREATE TABLE IF NOT EXISTS product_photos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  productId INT          NOT NULL,
  imageUrl  VARCHAR(255) NOT NULL,
  sortOrder INT          NOT NULL DEFAULT 0,
  createdAt DATETIME     NOT NULL DEFAULT NOW(),
  INDEX idx_productId (productId),
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4;
