INSERT INTO companies (id, name, city, phone, is_active)
VALUES
  ('a2000000-0000-0000-0000-000000000001', 'Alpha Rent a Car', 'Erbil', '0750 100 2000', TRUE),
  ('a2000000-0000-0000-0000-000000000002', 'Baghdad Auto Rental', 'Baghdad', '0770 200 3000', TRUE),
  ('a2000000-0000-0000-0000-000000000003', 'Basra Car Hire', 'Basra', '0780 300 4000', TRUE),
  ('a2000000-0000-0000-0000-000000000004', 'Suli Express Rentals', 'Sulaymaniyah', '0751 400 5000', TRUE),
  ('a2000000-0000-0000-0000-000000000005', 'Duhok Drive', 'Duhok', '0750 500 6000', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed cars for Alpha Rent a Car (Erbil)
INSERT INTO cars (id, company_id, make, model, year, price_per_day, city, image_url, is_available)
VALUES
  ('c2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla', 2022, 75000, 'Erbil', 'https://images.unsplash.com/photo-1623869675781-80aa31012c78?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'Kia', 'Sportage', 2023, 95000, 'Erbil', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001', 'Hyundai', 'Elantra', 2021, 65000, 'Erbil', 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000001', 'Toyota', 'Land Cruiser', 2020, 120000, 'Erbil', 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=600&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed cars for Baghdad Auto Rental
INSERT INTO cars (id, company_id, make, model, year, price_per_day, city, image_url, is_available)
VALUES
  ('c2000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'Nissan', 'Sunny', 2022, 55000, 'Baghdad', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000006', 'a2000000-0000-0000-0000-000000000002', 'Toyota', 'Camry', 2023, 90000, 'Baghdad', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000007', 'a2000000-0000-0000-0000-000000000002', 'Hyundai', 'Tucson', 2023, 100000, 'Baghdad', 'https://images.unsplash.com/photo-1633695632011-1500dbf046c6?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000008', 'a2000000-0000-0000-0000-000000000002', 'Kia', 'Cerato', 2021, 60000, 'Baghdad', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed cars for Basra Car Hire
INSERT INTO cars (id, company_id, make, model, year, price_per_day, city, image_url, is_available)
VALUES
  ('c2000000-0000-0000-0000-000000000009', 'a2000000-0000-0000-0000-000000000003', 'Toyota', 'Hilux', 2022, 85000, 'Basra', 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000010', 'a2000000-0000-0000-0000-000000000003', 'Mitsubishi', 'Lancer', 2020, 50000, 'Basra', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000011', 'a2000000-0000-0000-0000-000000000003', 'Nissan', 'Patrol', 2021, 130000, 'Basra', 'https://images.unsplash.com/photo-1606611013016-969c19ba27c9?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000012', 'a2000000-0000-0000-0000-000000000003', 'Kia', 'Rio', 2022, 45000, 'Basra', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed cars for Suli Express Rentals
INSERT INTO cars (id, company_id, make, model, year, price_per_day, city, image_url, is_available)
VALUES
  ('c2000000-0000-0000-0000-000000000013', 'a2000000-0000-0000-0000-000000000004', 'Hyundai', 'Sonata', 2023, 80000, 'Sulaymaniyah', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000014', 'a2000000-0000-0000-0000-000000000004', 'Toyota', 'RAV4', 2022, 95000, 'Sulaymaniyah', 'https://images.unsplash.com/photo-1568844293986-8d0400f085af?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000015', 'a2000000-0000-0000-0000-000000000004', 'Chevrolet', 'Malibu', 2021, 70000, 'Sulaymaniyah', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000016', 'a2000000-0000-0000-0000-000000000004', 'Ford', 'Explorer', 2023, 140000, 'Sulaymaniyah', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000017', 'a2000000-0000-0000-0000-000000000004', 'Kia', 'Picanto', 2022, 40000, 'Sulaymaniyah', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000018', 'a2000000-0000-0000-0000-000000000004', 'Toyota', 'Prado', 2020, 110000, 'Sulaymaniyah', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed cars for Duhok Drive
INSERT INTO cars (id, company_id, make, model, year, price_per_day, city, image_url, is_available)
VALUES
  ('c2000000-0000-0000-0000-000000000019', 'a2000000-0000-0000-0000-000000000005', 'Honda', 'Civic', 2022, 70000, 'Duhok', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000020', 'a2000000-0000-0000-0000-000000000005', 'Nissan', 'X-Trail', 2023, 105000, 'Duhok', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80', TRUE),
  ('c2000000-0000-0000-0000-000000000021', 'a2000000-0000-0000-0000-000000000005', 'Toyota', 'Yaris', 2021, 45000, 'Duhok', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;
