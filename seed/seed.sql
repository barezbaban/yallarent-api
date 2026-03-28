-- Companies
INSERT INTO companies (id, name, city, phone) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Alpha Rent a Car', 'Erbil', '0750 100 2000'),
  ('a1000000-0000-0000-0000-000000000002', 'Baghdad Auto Rental', 'Baghdad', '0770 200 3000'),
  ('a1000000-0000-0000-0000-000000000003', 'Basra Car Hire', 'Basra', '0780 300 4000');

-- Cars for Alpha Rent a Car (Erbil)
INSERT INTO cars (company_id, make, model, year, price_per_day, city, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Toyota', 'Corolla', 2022, 75000, 'Erbil',
   'Well-maintained Toyota Corolla with full insurance. Perfect for city driving and short trips.'),
  ('a1000000-0000-0000-0000-000000000001', 'Kia', 'Sportage', 2023, 95000, 'Erbil',
   'Spacious Kia Sportage SUV, great for families. Clean interior, regularly serviced.'),
  ('a1000000-0000-0000-0000-000000000001', 'Hyundai', 'Elantra', 2021, 65000, 'Erbil',
   'Fuel-efficient Hyundai Elantra. Ideal for daily commutes and city errands.'),
  ('a1000000-0000-0000-0000-000000000001', 'Toyota', 'Land Cruiser', 2020, 120000, 'Erbil',
   'Powerful Toyota Land Cruiser. Perfect for highway trips and rough terrain.');

-- Cars for Baghdad Auto Rental (Baghdad)
INSERT INTO cars (company_id, make, model, year, price_per_day, city, description) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Hyundai', 'Tucson', 2023, 90000, 'Baghdad',
   'Modern Hyundai Tucson with advanced safety features. Comfortable and reliable.'),
  ('a1000000-0000-0000-0000-000000000002', 'Toyota', 'Camry', 2022, 85000, 'Baghdad',
   'Smooth-riding Toyota Camry. Premium sedan for business and leisure.'),
  ('a1000000-0000-0000-0000-000000000002', 'Kia', 'Cerato', 2021, 60000, 'Baghdad',
   'Affordable Kia Cerato with low fuel consumption. Great value for budget renters.'),
  ('a1000000-0000-0000-0000-000000000002', 'Nissan', 'Sunny', 2022, 50000, 'Baghdad',
   'Compact Nissan Sunny. Easy to drive and park in busy city streets.');

-- Cars for Basra Car Hire (Basra)
INSERT INTO cars (company_id, make, model, year, price_per_day, city, description) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Toyota', 'Hilux', 2023, 110000, 'Basra',
   'Rugged Toyota Hilux pickup. Built for heavy-duty use and long-distance travel.'),
  ('a1000000-0000-0000-0000-000000000003', 'Hyundai', 'Accent', 2022, 55000, 'Basra',
   'Economical Hyundai Accent. Perfect for short city trips and daily rentals.'),
  ('a1000000-0000-0000-0000-000000000003', 'Kia', 'Sorento', 2021, 100000, 'Basra',
   'Comfortable Kia Sorento 7-seater. Ideal for group travel and family road trips.'),
  ('a1000000-0000-0000-0000-000000000003', 'Toyota', 'Corolla', 2023, 70000, 'Basra',
   'Latest model Toyota Corolla. Reliable, fuel-efficient, and well-equipped.');
