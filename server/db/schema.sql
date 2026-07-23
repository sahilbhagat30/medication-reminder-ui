-- schema.sql
-- Run this in your Cloud SQL Studio to create the database tables

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
    member_id VARCHAR(50) PRIMARY KEY,
    member_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    preferred_channel VARCHAR(20),
    consent_status VARCHAR(20) NOT NULL DEFAULT 'Allowed',
    active_coverage BOOLEAN NOT NULL DEFAULT TRUE,
    coverage_end_date DATE
);

-- 2. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    rx_id VARCHAR(50) PRIMARY KEY,
    member_id VARCHAR(50) REFERENCES members(member_id),
    drug_name VARCHAR(100) NOT NULL,
    pharmacy_id VARCHAR(50),
    pharmacy_name VARCHAR(100),
    pickup_status VARCHAR(50) NOT NULL,
    pickup_deadline DATE,
    ready_for_pickup BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    campaign_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    target_audience VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    launch_date TIMESTAMP,
    channels VARCHAR(100),
    success_rate NUMERIC(5, 2)
);

-- 4. Communication Logs Table
CREATE TABLE IF NOT EXISTS communication_logs (
    notif_id VARCHAR(50) PRIMARY KEY,
    member_id VARCHAR(50) REFERENCES members(member_id),
    rx_id VARCHAR(50) REFERENCES prescriptions(rx_id),
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reminder_sequence INTEGER DEFAULT 1,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failure_reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(pickup_status);
CREATE INDEX IF NOT EXISTS idx_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_member ON communication_logs(member_id);
