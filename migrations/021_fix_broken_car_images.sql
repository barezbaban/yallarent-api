-- Fix broken Unsplash image URLs for 10 cars

-- Toyota Corolla 2022
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1651950540805-b7c71869e689?w=600&q=80'
WHERE id = 'c2000000-0000-0000-0000-000000000001';

-- Hyundai Tucson 2023
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&q=80'
WHERE id = 'c2000000-0000-0000-0000-000000000007';

-- Nissan Patrol 2021
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80'
WHERE id = 'c2000000-0000-0000-0000-000000000011';

-- Kia Rio 2022
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=600&q=80'
WHERE id = 'c2000000-0000-0000-0000-000000000012';

-- Toyota RAV4 2022
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=600&q=80'
WHERE id = 'c2000000-0000-0000-0000-000000000014';

-- Suzuki Swift 2022
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80'
WHERE id = '1037ed2a-374c-4897-ab50-e6c8756d2cba';

-- Ford Transit 2023
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&q=80'
WHERE id = '02f33c72-25af-4158-bd4c-72a7e8203c9e';

-- Mercedes-Benz GLE 2023
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&q=80'
WHERE id = 'b56b5fd6-d796-4eb5-9fe8-c33601fed24f';

-- Mitsubishi L200 2022
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80'
WHERE id = 'ff7c66f1-10a4-4b1d-bc01-31f2ea9b928f';

-- Lexus LS 500 2023
UPDATE cars SET image_url = 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80'
WHERE id = 'c53a583e-399f-482b-9e1b-45d3f528ecc6';
