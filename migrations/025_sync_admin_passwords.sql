-- Sync password hashes from admins table to backoffice_users
-- (migration 022 copied hashes at creation time but they may have diverged)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
    UPDATE backoffice_users bu
    SET password_hash = a.password_hash
    FROM admins a
    WHERE bu.email = a.email;
  END IF;
END $$;
