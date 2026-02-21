-- Migration: Add emoji column to groups table
-- This column stores the group emoji icon (Notion-style)
-- Run in Supabase Dashboard > SQL Editor if not using automatic migrations

ALTER TABLE groups ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT NULL;
