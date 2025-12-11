/*
      # Create scores table for leaderboard

      1. New Tables
        - `scores`
          - `id` (uuid, primary key)
          - `username` (text, not null)
          - `score` (integer, not null)
          - `created_at` (timestamp with time zone)
      2. Security
        - Enable RLS on `scores` table
        - Add policy for public read access
        - Add policy for public insert access (for arcade style leaderboard)
    */

    CREATE TABLE IF NOT EXISTS scores (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      username text NOT NULL,
      score integer NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

    -- Herkesin skorları okumasına izin ver
    CREATE POLICY "Public read access"
      ON scores
      FOR SELECT
      USING (true);

    -- Herkesin skor eklemesine izin ver (Basit arcade mantığı)
    CREATE POLICY "Public insert access"
      ON scores
      FOR INSERT
      WITH CHECK (true);
