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

-- Mark existing users as not needing password change (they already have working passwords)
UPDATE backoffice_users SET must_change_password = FALSE WHERE must_change_password IS NULL;

-- New users default to must_change_password = TRUE
ALTER TABLE backoffice_users ALTER COLUMN must_change_password SET DEFAULT TRUE;

-- Add unique constraint on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_backoffice_users_username ON backoffice_users(username) WHERE username IS NOT NULL;

-- Keep email unique where it's not null
DROP INDEX IF EXISTS backoffice_users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_backoffice_users_email ON backoffice_users(email) WHERE email IS NOT NULL;

-- Copy admin from admins table to backoffice_users if not already there
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
WHERE a.email NOT IN (SELECT email FROM backoffice_users WHERE email IS NOT NULL)
  AND EXISTS (SELECT 1 FROM roles WHERE name = 'Super Admin')
ON CONFLICT DO NOTHING;
