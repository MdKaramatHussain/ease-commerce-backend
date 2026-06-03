-- Ease Commerce Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS ease_commerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ease_commerce;

-- Users Table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders Table
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  courier_partner VARCHAR(50) NOT NULL,
  courier_order_id VARCHAR(100),
  awb_number VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
  request_payload JSON NOT NULL,
  response_payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_awb_number (awb_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tracking History Table (Append-only)
CREATE TABLE tracking_history (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  raw_payload JSON NOT NULL,
  event_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_event_time (event_time),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Batches Table
CREATE TABLE batches (
  id VARCHAR(36) PRIMARY KEY,
  batch_id VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  total_orders INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_batch_id (batch_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial data (Demo users)
INSERT INTO users (id, email, password, role) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2a$10$YOvVJAdwy48/6L/q3E.XdOzT6fGjmzTHMYw5lB8mzvT3J2yZ1MeYW', 'ADMIN'),
  ('550e8400-e29b-41d4-a716-446655440002', 'operator@example.com', '$2a$10$TQxQwJ.VxPt3vB5u9L3a.OqT4r9kL2nB6H8mY5pZ1Q3D9N8mF6eXy', 'OPERATOR');

-- Passwords are hashed with bcrypt
-- admin@example.com : admin@123
-- operator@example.com : operator@123
