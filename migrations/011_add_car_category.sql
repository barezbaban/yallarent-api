-- Add category column to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'sedan';

-- Set categories based on existing car models
UPDATE cars SET category = 'suv' WHERE model IN ('Sportage', 'Tucson', 'Sorento', 'Land Cruiser');
UPDATE cars SET category = 'pickup' WHERE model IN ('Hilux');
UPDATE cars SET category = 'sedan' WHERE model IN ('Corolla', 'Camry', 'Elantra', 'Cerato', 'Sunny', 'Accent');

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category);
