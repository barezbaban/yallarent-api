INSERT INTO users (id, full_name, phone, password_hash, city) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'Ahmed Hassan', '07501110001', '$2b$10$fakehashnotreal00000000000000000000000000000000000', 'Erbil'),
  ('b2000000-0000-0000-0000-000000000002', 'Sara Ali', '07701110002', '$2b$10$fakehashnotreal00000000000000000000000000000000000', 'Baghdad'),
  ('b2000000-0000-0000-0000-000000000003', 'Omar Khalid', '07801110003', '$2b$10$fakehashnotreal00000000000000000000000000000000000', 'Basra'),
  ('b2000000-0000-0000-0000-000000000004', 'Lina Mustafa', '07501110004', '$2b$10$fakehashnotreal00000000000000000000000000000000000', 'Erbil'),
  ('b2000000-0000-0000-0000-000000000005', 'Karwan Aziz', '07701110005', '$2b$10$fakehashnotreal00000000000000000000000000000000000', 'Sulaymaniyah')
ON CONFLICT (phone) DO NOTHING;

DO $$
DECLARE
  car_rec RECORD;
  user_ids UUID[] := ARRAY[
    'b2000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000003',
    'b2000000-0000-0000-0000-000000000004',
    'b2000000-0000-0000-0000-000000000005'
  ];
  review_texts TEXT[] := ARRAY[
    'Amazing car, very clean and well maintained. The company was super responsive and helpful.',
    'Great experience overall. Car was in perfect condition. Will definitely rent again!',
    'Smooth ride, comfortable seats. Picked up on time with no hassle at all.',
    'Good value for the price. Car had low mileage and drove like new.',
    'Excellent service from start to finish. The car exceeded my expectations.',
    'Very reliable car for our family trip. Kids loved the space and comfort.',
    'Perfect for city driving. Easy to park and great fuel economy.',
    'The car was spotless inside and out. Professional service from the rental company.',
    'Had a wonderful road trip with this car. Would highly recommend to anyone.',
    'Fast pickup process, friendly staff, and the car was exactly as described.',
    'Best rental experience in Iraq. The car was top notch quality.',
    'Drove it for a week, zero issues. Comfortable even on long highway stretches.',
    'Really impressed with the quality. Air conditioning worked perfectly in the summer heat.',
    'Good car for the price range. Nothing fancy but gets the job done well.',
    'The company went above and beyond. They even delivered the car to my hotel.'
  ];
  ratings INT[] := ARRAY[5, 4, 5, 4, 5, 5, 4, 5, 4, 3, 5, 4, 5, 3, 5];
  booking_id UUID;
  user_idx INT;
  review_idx INT := 1;
  start_d DATE;
BEGIN
  FOR car_rec IN
    SELECT id, price_per_day FROM cars ORDER BY created_at LIMIT 15
  LOOP
    user_idx := ((review_idx - 1) % 5) + 1;
    start_d := '2025-12-01'::date + (review_idx * 3);

    INSERT INTO bookings (id, car_id, renter_id, start_date, end_date, total_price, status)
    VALUES (
      gen_random_uuid(),
      car_rec.id,
      user_ids[user_idx],
      start_d,
      start_d + 3,
      car_rec.price_per_day * 3,
      'completed'
    )
    RETURNING id INTO booking_id;

    INSERT INTO reviews (booking_id, car_id, user_id, rating, review_text)
    VALUES (
      booking_id,
      car_rec.id,
      user_ids[user_idx],
      ratings[review_idx],
      review_texts[review_idx]
    );

    review_idx := review_idx + 1;
  END LOOP;
END $$;
