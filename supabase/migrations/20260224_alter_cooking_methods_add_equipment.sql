-- Migration: add equipment_needed column to catalog_cooking_methods
-- Run via: paste into https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS equipment_needed text;
