-- Seed cars for all categories across the 3 existing companies
-- Company IDs:
--   a1000000-...-001 = Alpha Rent a Car (Erbil)
--   a1000000-...-002 = Baghdad Auto Rental (Baghdad)
--   a1000000-...-003 = Basra Car Hire (Basra)

-- ============ LUXURY ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Mercedes-Benz', 'S-Class', 2024, 250000, 'Erbil', 'luxury',
   'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
   'The pinnacle of luxury. Mercedes S-Class with massaging seats, ambient lighting, and premium sound system.'),
  ('a1000000-0000-0000-0000-000000000002', 'BMW', '7 Series', 2023, 230000, 'Baghdad', 'luxury',
   'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
   'Executive luxury at its finest. BMW 7 Series with rear entertainment, heated seats, and night vision.'),
  ('a1000000-0000-0000-0000-000000000003', 'Audi', 'A8', 2023, 220000, 'Basra', 'luxury',
   'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
   'Audi A8 with quattro all-wheel drive, virtual cockpit, and Bang & Olufsen audio.'),
  ('a1000000-0000-0000-0000-000000000001', 'Lexus', 'LS 500', 2023, 210000, 'Erbil', 'luxury',
   'https://images.unsplash.com/photo-1621993202323-eb4b4d6e5e7c?w=800&q=80',
   'Japanese luxury perfected. Lexus LS 500 with hand-pleated door trim and Mark Levinson audio.');

-- ============ EXOTIC ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Porsche', '911 Carrera', 2024, 350000, 'Erbil', 'exotic',
   'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
   'Iconic Porsche 911 Carrera. Twin-turbo flat-six, sport chrono package, and launch control.'),
  ('a1000000-0000-0000-0000-000000000002', 'Lamborghini', 'Huracan', 2023, 500000, 'Baghdad', 'exotic',
   'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
   'Turn every head on the road. Lamborghini Huracan with V10 engine and all-wheel drive.'),
  ('a1000000-0000-0000-0000-000000000001', 'Ferrari', 'Roma', 2023, 450000, 'Erbil', 'exotic',
   'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=80',
   'La Nuova Dolce Vita. Ferrari Roma with 612 HP twin-turbo V8 and 8-speed dual-clutch.'),
  ('a1000000-0000-0000-0000-000000000003', 'Maserati', 'GranTurismo', 2023, 380000, 'Basra', 'exotic',
   'https://images.unsplash.com/photo-1580414057403-c5f451f30e1c?w=800&q=80',
   'Italian grand touring perfection. Maserati GranTurismo with Nettuno V6 engine.');

-- ============ CLASSIC ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ford', 'Mustang GT', 1967, 200000, 'Erbil', 'classic',
   'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
   'Iconic 1967 Ford Mustang GT fastback. Fully restored, V8 engine, classic American muscle.'),
  ('a1000000-0000-0000-0000-000000000002', 'Chevrolet', 'Camaro SS', 1969, 220000, 'Baghdad', 'classic',
   'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
   'Classic 1969 Camaro SS with big block V8. A true collector piece available for special occasions.'),
  ('a1000000-0000-0000-0000-000000000003', 'Mercedes-Benz', '300SL', 1955, 300000, 'Basra', 'classic',
   'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
   'The legendary Mercedes 300SL Gullwing. Perfect for weddings, photoshoots, and special events.');

-- ============ LIMOUSINE ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Lincoln', 'Town Car Limo', 2022, 300000, 'Erbil', 'limousine',
   'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=800&q=80',
   'Stretched Lincoln Town Car limousine. Seats 8 passengers with minibar, LED lighting, and privacy partition.'),
  ('a1000000-0000-0000-0000-000000000002', 'Cadillac', 'Escalade Limo', 2023, 350000, 'Baghdad', 'limousine',
   'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=80',
   'Cadillac Escalade stretch limo with VIP interior, surround sound, and fiber optic ceiling.'),
  ('a1000000-0000-0000-0000-000000000003', 'Mercedes-Benz', 'V-Class VIP', 2023, 280000, 'Basra', 'limousine',
   'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800&q=80',
   'Mercedes V-Class converted to VIP spec. Captain seats, table, privacy glass, and premium finish.');

-- ============ ECONOMY ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Toyota', 'Yaris', 2023, 40000, 'Erbil', 'economy',
   'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80',
   'Compact and fuel-efficient Toyota Yaris. Perfect for city driving with excellent gas mileage.'),
  ('a1000000-0000-0000-0000-000000000002', 'Suzuki', 'Swift', 2022, 35000, 'Baghdad', 'economy',
   'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80',
   'Nimble Suzuki Swift. Easy to park, cheap to run, great for budget-conscious renters.'),
  ('a1000000-0000-0000-0000-000000000003', 'Kia', 'Picanto', 2023, 30000, 'Basra', 'economy',
   'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80',
   'Kia Picanto — the ultimate city car. Low fuel costs and easy handling for everyday errands.'),
  ('a1000000-0000-0000-0000-000000000002', 'Hyundai', 'i10', 2022, 32000, 'Baghdad', 'economy',
   'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80',
   'Hyundai i10 with Apple CarPlay. Small on the outside, surprisingly roomy inside.');

-- ============ VAN ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Toyota', 'HiAce', 2023, 130000, 'Erbil', 'van',
   'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80',
   'Toyota HiAce 15-seater van. Ideal for group trips, airport transfers, and team travel.'),
  ('a1000000-0000-0000-0000-000000000002', 'Hyundai', 'H1', 2022, 110000, 'Baghdad', 'van',
   'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80',
   'Hyundai H1 passenger van. 9 seats with air conditioning and comfortable ride for long journeys.'),
  ('a1000000-0000-0000-0000-000000000003', 'Ford', 'Transit', 2023, 120000, 'Basra', 'van',
   'https://images.unsplash.com/photo-1581235707960-35f13de60cb7?w=800&q=80',
   'Ford Transit passenger van. Spacious 12-seater, perfect for events and corporate transport.');

-- ============ MORE SUVs ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Range Rover', 'Sport', 2024, 200000, 'Erbil', 'suv',
   'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
   'Range Rover Sport with dynamic air suspension, meridian sound, and terrain response system.'),
  ('a1000000-0000-0000-0000-000000000002', 'BMW', 'X5', 2023, 180000, 'Baghdad', 'suv',
   'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80',
   'BMW X5 xDrive with panoramic roof, third row seats, and driving assistant professional.'),
  ('a1000000-0000-0000-0000-000000000003', 'Mercedes-Benz', 'GLE', 2023, 190000, 'Basra', 'suv',
   'https://images.unsplash.com/photo-1519245659620-e859806a8d7b?w=800&q=80',
   'Mercedes GLE with MBUX infotainment, burmester sound, and energizing comfort control.');

-- ============ MORE SEDANS ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Honda', 'Accord', 2023, 80000, 'Erbil', 'sedan',
   'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80',
   'Honda Accord with Honda Sensing suite, wireless CarPlay, and spacious rear seats.'),
  ('a1000000-0000-0000-0000-000000000002', 'Mazda', '6', 2023, 78000, 'Baghdad', 'sedan',
   'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
   'Mazda 6 with SkyActiv technology. Premium feel with excellent driving dynamics.');

-- ============ MORE PICKUPS ============
INSERT INTO cars (company_id, make, model, year, price_per_day, city, category, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ford', 'Ranger', 2023, 115000, 'Erbil', 'pickup',
   'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
   'Ford Ranger Wildtrak with 4WD, bed liner, and tow package. Ready for any terrain.'),
  ('a1000000-0000-0000-0000-000000000002', 'Mitsubishi', 'L200', 2022, 100000, 'Baghdad', 'pickup',
   'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
   'Mitsubishi L200 double cab. Reliable workhorse with Super Select 4WD and rear diff lock.');
