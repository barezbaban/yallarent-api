-- ====================================================================
-- 027: Partner Management System
-- Creates partners, contracts, documents, payouts, notes tables.
-- Migrates existing companies data into the new partners table.
-- ====================================================================

-- ── Partners table ──
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  company_name_ar VARCHAR(200),
  logo_url TEXT,
  description TEXT,
  city VARCHAR(50) NOT NULL,
  full_address TEXT NOT NULL DEFAULT '',
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  contact_person_name VARCHAR(200) NOT NULL DEFAULT '',
  contact_person_email VARCHAR(255),
  contact_person_phone VARCHAR(30) NOT NULL DEFAULT '',
  emergency_phone VARCHAR(30),
  commercial_registration_number VARCHAR(100) NOT NULL DEFAULT '',
  tax_id VARCHAR(100),
  bank_name VARCHAR(200),
  bank_account_holder VARCHAR(200),
  bank_iban VARCHAR(100),
  bank_branch VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  suspension_reason TEXT,
  termination_reason TEXT,
  onboarded_by UUID REFERENCES backoffice_users(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_city ON partners(city);
CREATE INDEX IF NOT EXISTS idx_partners_city_status ON partners(city, status);

-- ── Partner contracts ──
CREATE TABLE IF NOT EXISTS partner_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  commission_type VARCHAR(20) NOT NULL
    CHECK (commission_type IN ('percentage', 'fixed_per_booking')),
  commission_value DECIMAL(12, 2) NOT NULL,
  payment_frequency VARCHAR(20) NOT NULL
    CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  contract_document_url TEXT,
  special_terms TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_contracts_partner_status ON partner_contracts(partner_id, status);

-- ── Partner documents ──
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  document_type VARCHAR(30) NOT NULL
    CHECK (document_type IN ('business_license', 'insurance_certificate', 'signed_contract', 'vehicle_registration', 'tax_certificate', 'other')),
  document_name VARCHAR(300) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  expiry_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES backoffice_users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_documents_partner_type ON partner_documents(partner_id, document_type);
CREATE INDEX IF NOT EXISTS idx_partner_documents_expiry ON partner_documents(expiry_date);

-- ── Partner payouts ──
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  gross_revenue DECIMAL(14, 2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  net_payout DECIMAL(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(200),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES backoffice_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_status ON partner_payouts(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_period ON partner_payouts(partner_id, period_start, period_end);

-- ── Partner notes ──
CREATE TABLE IF NOT EXISTS partner_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES backoffice_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type VARCHAR(20) NOT NULL DEFAULT 'general'
    CHECK (note_type IN ('general', 'call', 'meeting', 'issue', 'follow_up')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_notes_partner ON partner_notes(partner_id);

-- ── Add partner_id to cars table (link cars to partners) ──
ALTER TABLE cars ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cars_partner ON cars(partner_id);

-- ── Serve uploaded partner files ──
-- (handled in app.js static middleware)

-- ── Migrate existing companies into partners ──
INSERT INTO partners (id, company_name, logo_url, city, full_address, contact_person_name, contact_person_phone, status, activated_at, created_at)
SELECT
  c.id,
  c.name,
  c.logo_url,
  c.city,
  COALESCE(c.address, ''),
  c.name,
  c.phone,
  CASE WHEN c.is_active THEN 'active' ELSE 'suspended' END,
  CASE WHEN c.is_active THEN NOW() ELSE NULL END,
  c.created_at
FROM companies c
ON CONFLICT (id) DO NOTHING;

-- ── Link existing cars to their partner via company_id ──
UPDATE cars SET partner_id = company_id WHERE partner_id IS NULL AND company_id IS NOT NULL;

-- ── Create default contracts for migrated active partners ──
INSERT INTO partner_contracts (partner_id, commission_type, commission_value, payment_frequency, contract_start_date, contract_end_date, status)
SELECT
  p.id,
  'percentage',
  15,
  'monthly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  'active'
FROM partners p
WHERE p.status = 'active'
AND NOT EXISTS (SELECT 1 FROM partner_contracts pc WHERE pc.partner_id = p.id);
