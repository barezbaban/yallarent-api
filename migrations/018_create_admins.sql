CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin (password: Admin@123)
INSERT INTO admins (email, password_hash, full_name, role)
VALUES (
  'admin@yallarent.com',
  '$2b$10$tpRb43OPNNWVGHAcrWL6pu3wXXSw6FVx0a7dayuxXsvxyj/Q3MuzS',
  'Admin Agent',
  'superadmin'
) ON CONFLICT (email) DO NOTHING;
