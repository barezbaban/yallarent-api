-- Add username column and must_change_password flag to backoffice_users
-- Allow login with username, make email optional

ALTER TABLE backoffice_users
  ADD COLUMN IF NOT EXISTS username VARCHAR(50),
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

-- Make email nullable (was NOT NULL)
ALTER TABLE backoffice_users ALTER COLUMN email DROP NOT NULL;

-- Set existing users: generate username from full_name, mark password as already set
UPDATE backoffice_users
SET username = LOWER(REPLACE(full_name, ' ', '.'))
WHERE username IS NULL;

-- Mark existing users as not needing password change
UPDATE backoffice_users SET must_change_password = FALSE WHERE must_change_password IS NULL;

-- New users default to must_change_password = TRUE
ALTER TABLE backoffice_users ALTER COLUMN must_change_password SET DEFAULT TRUE;

-- Add unique constraint on username (partial - only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_backoffice_users_username ON backoffice_users(username) WHERE username IS NOT NULL;

-- Drop existing email unique constraint (name varies by DB)
DO $$
BEGIN
  -- Try dropping by common constraint names
  EXECUTE (
    SELECT 'ALTER TABLE backoffice_users DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'backoffice_users'::regclass
      AND contype = 'u'
      AND EXISTS (
        SELECT 1 FROM unnest(conkey) k
        JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k
        WHERE a.attname = 'email'
      )
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Re-add email unique as partial index (only where email is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_backoffice_users_email ON backoffice_users(email) WHERE email IS NOT NULL;

-- Sync admin passwords from admins table to backoffice_users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
    -- Insert any missing admins
    INSERT INTO backoffice_users (full_name, username, email, password_hash, role_id, must_change_password, is_active)
    SELECT
      a.full_name,
      LOWER(REPLACE(a.full_name, ' ', '.')),
      a.email,
      a.password_hash,
      (SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1),
      FALSE,
      a.is_active
    FROM admins a
    WHERE NOT EXISTS (SELECT 1 FROM backoffice_users bu WHERE bu.email = a.email)
      AND EXISTS (SELECT 1 FROM roles WHERE name = 'Super Admin')
    ON CONFLICT DO NOTHING;

    -- Sync password hashes for existing users
    UPDATE backoffice_users bu
    SET password_hash = a.password_hash
    FROM admins a
    WHERE bu.email = a.email;
  END IF;
END $$;
