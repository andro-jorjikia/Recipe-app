-- Migration: Alter user_id column in favorites table from integer to text
ALTER TABLE favorites ALTER COLUMN user_id TYPE text; 