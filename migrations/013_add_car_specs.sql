ALTER TABLE cars ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'sedan';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission VARCHAR(10) DEFAULT 'automatic';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS passengers INTEGER DEFAULT 5;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS luggage INTEGER DEFAULT 2;

UPDATE cars SET transmission = 'automatic', passengers = 5, luggage = 2 WHERE category = 'sedan';
UPDATE cars SET transmission = 'automatic', passengers = 7, luggage = 3 WHERE category = 'suv';
UPDATE cars SET transmission = 'manual', passengers = 3, luggage = 1 WHERE category = 'pickup';
UPDATE cars SET transmission = 'automatic', passengers = 5, luggage = 3 WHERE category = 'luxury';
UPDATE cars SET transmission = 'automatic', passengers = 2, luggage = 1 WHERE category = 'exotic';
UPDATE cars SET transmission = 'manual', passengers = 4, luggage = 1 WHERE category = 'classic';
UPDATE cars SET transmission = 'automatic', passengers = 8, luggage = 4 WHERE category = 'limousine';
UPDATE cars SET transmission = 'manual', passengers = 5, luggage = 2 WHERE category = 'economy';
UPDATE cars SET transmission = 'automatic', passengers = 8, luggage = 6 WHERE category = 'van';

CREATE INDEX IF NOT EXISTS idx_cars_transmission ON cars(transmission);
