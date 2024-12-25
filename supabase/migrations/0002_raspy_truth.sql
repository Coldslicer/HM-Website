/*
  # Fix clients table RLS policies

  1. Changes
    - Add policy to allow new users to insert their own client record
    - Add policy to allow users to update their own client record
  
  2. Security
    - Maintains existing read-only policy
    - Ensures users can only manage their own records
*/

-- Allow users to insert their own client record
CREATE POLICY "Users can insert own client record"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own client record
CREATE POLICY "Users can update own client record"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);