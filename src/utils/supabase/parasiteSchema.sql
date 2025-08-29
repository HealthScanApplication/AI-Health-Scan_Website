-- Create or update the parasites table with the correct schema
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS parasites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    common_name VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    transmission TEXT,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    geographic_distribution TEXT,
    host_range TEXT,
    life_cycle TEXT,
    health_risk VARCHAR(50),
    food_association TEXT,
    incubation_period VARCHAR(100),
    source VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parasites_name ON parasites(name);
CREATE INDEX IF NOT EXISTS idx_parasites_category ON parasites(category);
CREATE INDEX IF NOT EXISTS idx_parasites_health_risk ON parasites(health_risk);
CREATE INDEX IF NOT EXISTS idx_parasites_created_at ON parasites(created_at);

-- Enable RLS (Row Level Security) - adjust policies as needed
ALTER TABLE parasites ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin read access" ON parasites
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin write access" ON parasites
    FOR ALL TO authenticated
    USING (true);

-- Create policy for anonymous read access (if needed)
CREATE POLICY "Public read access" ON parasites
    FOR SELECT TO anon
    USING (true);

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parasites_updated_at
    BEFORE UPDATE ON parasites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();