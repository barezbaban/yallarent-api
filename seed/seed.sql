-- Companies
INSERT INTO companies (id, name, city, phone) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Alpha Rent a Car', 'Erbil', '0750 100 2000'),
  ('a1000000-0000-0000-0000-000000000002', 'Baghdad Auto Rental', 'Baghdad', '0770 200 3000'),
  ('a1000000-0000-0000-0000-000000000003', 'Basra Car Hire', 'Basra', '0780 300 4000');

-- Cars for Alpha Rent a Car (Erbil)
INSERT INTO cars (company_id, make, model, year, price_per_day, city, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla', 2022, 75000, 'Erbil',
   'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800&q=80',
   'Well-maintained Toyota Corolla with full insurance. Perfect for city driving and short trips.'),
  ('a1000000-0000-0000-0000-000000000001', 'Kia', 'Sportage', 2023, 95000, 'Erbil',
   'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80',
   'Spacious Kia Sportage SUV, great for families. Clean interior, regularly serviced.'),
  ('a1000000-0000-0000-0000-000000000001', 'Hyundai', 'Elantra', 2021, 65000, 'Erbil',
   'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&q=80',
   'Fuel-efficient Hyundai Elantra. Ideal for daily commutes and city errands.'),
  ('a1000000-0000-0000-0000-000000000001', 'Toyota', 'Land Cruiser', 2020, 120000, 'Erbil',
   'https://images.unsplash.com/photo-1581235707960-35f13de60cb7?w=800&q=80',
   'Powerful Toyota Land Cruiser. Perfect for highway trips and rough terrain.');

-- Cars for Baghdad Auto Rental (Baghdad)
INSERT INTO cars (company_id, make, model, year, price_per_day, city, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Hyundai', 'Tucson', 2023, 90000, 'Baghdad',
   'https://images.unsplash.com/photo-1633695450519-e0e1c8a4eab1?w=800&q=80',
   'Modern Hyundai Tucson with advanced safety features. Comfortable and reliable.'),
  ('a1000000-0000-0000-0000-000000000002', 'Toyota', 'Camry', 2022, 85000, 'Baghdad',
   'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
   'Smooth-riding Toyota Camry. Premium sedan for business and leisure.'),
  ('a1000000-0000-0000-0000-000000000002', 'Kia', 'Cerato', 2021, 60000, 'Baghdad',
   'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80',
   'Affordable Kia Cerato with low fuel consumption. Great value for budget renters.'),
  ('a1000000-0000-0000-0000-000000000002', 'Nissan', 'Sunny', 2022, 50000, 'Baghdad',
   'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
   'Compact Nissan Sunny. Easy to drive and park in busy city streets.');

-- Cars for Basra Car Hire (Basra)
INSERT INTO cars (company_id, make, model, year, price_per_day, city, image_url, description) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Toyota', 'Hilux', 2023, 110000, 'Basra',
   'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80',
   'Rugged Toyota Hilux pickup. Built for heavy-duty use and long-distance travel.'),
  ('a1000000-0000-0000-0000-000000000003', 'Hyundai', 'Accent', 2022, 55000, 'Basra',
   'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
   'Economical Hyundai Accent. Perfect for short city trips and daily rentals.'),
  ('a1000000-0000-0000-0000-000000000003', 'Kia', 'Sorento', 2021, 100000, 'Basra',
   'https://images.unsplash.com/photo-1619976215249-0bcdaef1780c?w=800&q=80',
   'Comfortable Kia Sorento 7-seater. Ideal for group travel and family road trips.'),
  ('a1000000-0000-0000-0000-000000000003', 'Toyota', 'Corolla', 2023, 70000, 'Basra',
   'https://images.unsplash.com/photo-1638618164682-12b986ec2a75?w=800&q=80',
   'Latest model Toyota Corolla. Reliable, fuel-efficient, and well-equipped.');
