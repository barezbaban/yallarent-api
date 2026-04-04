-- Roles table with JSONB permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backoffice users table
CREATE TABLE IF NOT EXISTS backoffice_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the Super Admin role with ALL permissions
INSERT INTO roles (name, description, permissions) VALUES (
  'Super Admin',
  'Full system access. This role cannot be edited or deleted.',
  '{
    "dashboard.view": true,
    "bookings.view": true, "bookings.edit": true, "bookings.cancel": true, "bookings.refund": true,
    "cars.view": true, "cars.add": true, "cars.edit": true, "cars.delete": true, "cars.availability": true,
    "customers.view": true, "customers.edit": true, "customers.block": true,
    "companies.view": true, "companies.add": true, "companies.edit": true, "companies.suspend": true,
    "payments.view": true, "payments.refund": true, "payments.reports": true,
    "promotions.view": true, "promotions.create": true, "promotions.edit": true, "promotions.delete": true,
    "support.view": true, "support.respond": true, "support.escalate": true, "support.close": true,
    "reports.view": true, "reports.export": true,
    "settings.view": true, "settings.edit": true,
    "users.view": true, "users.create": true, "users.edit": true, "users.deactivate": true,
    "roles.view": true, "roles.create": true, "roles.edit": true, "roles.delete": true
  }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Migrate existing superadmin from admins table (if it exists) to backoffice_users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
    INSERT INTO backoffice_users (full_name, email, password_hash, role_id)
    SELECT
      a.full_name,
      a.email,
      a.password_hash,
      r.id
    FROM admins a
    CROSS JOIN roles r
    WHERE a.email = 'admin@yallarent.com'
      AND r.name = 'Super Admin'
      AND NOT EXISTS (
        SELECT 1 FROM backoffice_users bu WHERE bu.email = a.email
      );
  END IF;
END $$;
