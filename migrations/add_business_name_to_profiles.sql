-- Add business_name column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
