/*
  # Initial Schema Setup

  1. New Tables
    - `clients`
      - Stores client company information
      - Links to Supabase auth users
    - `campaigns`
      - Stores campaign information
      - Links to clients
    - `creators`
      - Stores creator information from form submissions
    - `campaign_creators`
      - Junction table for campaign-creator relationships
      - Tracks selection status and payment

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  company_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  duration integer NOT NULL CHECK (duration >= 1),
  deliverable_type text NOT NULL CHECK (
    deliverable_type IN ('short_form', 'sponsored_segment', 'full_video')
  ),
  niches text[] NOT NULL,
  brief_url text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'brief_submitted', 'creators_selected', 'contract_signed', 'completed')
  ),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can CRUD own campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (client_id = auth.uid());

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_url text NOT NULL UNIQUE,
  channel_name text,
  subscriber_count integer,
  view_count integer,
  niches text[] NOT NULL,
  rate decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view creators"
  ON creators
  FOR SELECT
  TO authenticated
  USING (true);

-- Campaign Creators junction table
CREATE TABLE IF NOT EXISTS campaign_creators (
  campaign_id uuid REFERENCES campaigns(id),
  creator_id uuid REFERENCES creators(id),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'selected', 'contract_signed', 'completed', 'rejected')
  ),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (campaign_id, creator_id)
);

ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their campaign creators"
  ON campaign_creators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_id
      AND campaigns.client_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaign_creators_updated_at
  BEFORE UPDATE ON campaign_creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();