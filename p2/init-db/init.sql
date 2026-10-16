-- 1. Create the attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_present BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed initial mock records into your fresh table
INSERT INTO attendance (name, is_present) VALUES 
('John Doe', true),
('Jane Smith', false),
('Alex Jones', true),
('Sarah Connor', true)
ON CONFLICT DO NOTHING;
