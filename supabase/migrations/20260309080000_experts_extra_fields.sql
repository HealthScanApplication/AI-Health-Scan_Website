-- ============================================================
-- Migration: Add extra contact/social/booking fields to hs_experts
-- Created: 2026-03-09
-- ============================================================

ALTER TABLE hs_experts ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE hs_experts ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE hs_experts ADD COLUMN IF NOT EXISTS booking_url TEXT;          -- opens payment flow
ALTER TABLE hs_experts ADD COLUMN IF NOT EXISTS google_schedule_url TEXT;  -- Google Calendar scheduling link
