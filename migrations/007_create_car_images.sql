-- Feature 3: Multiple car images for gallery/carousel
CREATE TABLE IF NOT EXISTS car_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id);

-- Seed: copy existing image_url as first image for each car
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, image_url, 0 FROM cars WHERE image_url IS NOT NULL;

-- Seed additional images per car (by make/model)
-- Toyota Corolla (Erbil)
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?w=800&q=80', 1
FROM cars WHERE make = 'Toyota' AND model = 'Corolla' AND city = 'Erbil';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80', 2
FROM cars WHERE make = 'Toyota' AND model = 'Corolla' AND city = 'Erbil';

-- Kia Sportage
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80', 1
FROM cars WHERE make = 'Kia' AND model = 'Sportage';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', 2
FROM cars WHERE make = 'Kia' AND model = 'Sportage';

-- Hyundai Elantra
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80', 1
FROM cars WHERE make = 'Hyundai' AND model = 'Elantra';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', 2
FROM cars WHERE make = 'Hyundai' AND model = 'Elantra';

-- Toyota Land Cruiser
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80', 1
FROM cars WHERE make = 'Toyota' AND model = 'Land Cruiser';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80', 2
FROM cars WHERE make = 'Toyota' AND model = 'Land Cruiser';

-- Toyota Camry
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80', 1
FROM cars WHERE make = 'Toyota' AND model = 'Camry';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80', 2
FROM cars WHERE make = 'Toyota' AND model = 'Camry';

-- Hyundai Tucson
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', 1
FROM cars WHERE make = 'Hyundai' AND model = 'Tucson';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80', 2
FROM cars WHERE make = 'Hyundai' AND model = 'Tucson';

-- Nissan Sunny
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80', 1
FROM cars WHERE make = 'Nissan' AND model = 'Sunny';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80', 2
FROM cars WHERE make = 'Nissan' AND model = 'Sunny';

-- Kia Cerato
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80', 1
FROM cars WHERE make = 'Kia' AND model = 'Cerato';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80', 2
FROM cars WHERE make = 'Kia' AND model = 'Cerato';

-- Kia Sorento
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80', 1
FROM cars WHERE make = 'Kia' AND model = 'Sorento';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80', 2
FROM cars WHERE make = 'Kia' AND model = 'Sorento';

-- Toyota Corolla (Basra)
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?w=800&q=80', 1
FROM cars WHERE make = 'Toyota' AND model = 'Corolla' AND city = 'Basra';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80', 2
FROM cars WHERE make = 'Toyota' AND model = 'Corolla' AND city = 'Basra';

-- Toyota Hilux
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80', 1
FROM cars WHERE make = 'Toyota' AND model = 'Hilux';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80', 2
FROM cars WHERE make = 'Toyota' AND model = 'Hilux';

-- Hyundai Accent
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', 1
FROM cars WHERE make = 'Hyundai' AND model = 'Accent';
INSERT INTO car_images (car_id, image_url, display_order)
SELECT id, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80', 2
FROM cars WHERE make = 'Hyundai' AND model = 'Accent';
