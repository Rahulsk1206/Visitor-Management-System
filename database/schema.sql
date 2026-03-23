-- ============================================
-- Phase 1: Database Schema for Visitor Management System
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS visitor_db;
USE visitor_db;

-- Create the visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    purpose_of_visit VARCHAR(500) NOT NULL,
    check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL DEFAULT NULL
);

-- Optional: Insert sample data for testing
INSERT INTO visitors (full_name, email, phone_number, purpose_of_visit, check_in_time, check_out_time) VALUES
('John Doe', 'john.doe@example.com', '9876543210', 'Client Meeting', '2026-03-16 09:00:00', NULL),
('Jane Smith', 'jane.smith@example.com', '9876543211', 'Job Interview', '2026-03-16 09:30:00', '2026-03-16 11:00:00'),
('Robert Brown', 'robert.b@example.com', '9876543212', 'Delivery', '2026-03-16 10:00:00', NULL);
