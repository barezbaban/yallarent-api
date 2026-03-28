-- Features 1+2: Time picker and pickup/dropoff locations for bookings
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(5) DEFAULT '09:00';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dropoff_time VARCHAR(5) DEFAULT '09:00';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_location TEXT DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dropoff_location TEXT DEFAULT '';

-- Seed company addresses
UPDATE companies SET address = 'Gulan Street, Erbil' WHERE city = 'Erbil' AND address = '';
UPDATE companies SET address = 'Karrada District, Baghdad' WHERE city = 'Baghdad' AND address = '';
UPDATE companies SET address = 'Al Ashar, Basra' WHERE city = 'Basra' AND address = '';
UPDATE companies SET address = 'Bakhtiary Road, Sulaymaniyah' WHERE city = 'Sulaymaniyah' AND address = '';
