-- ============================================================
-- Chat System: conversations, messages, canned_responses, chat_notes
-- ============================================================

-- Drop old basic support tables (replaced by this richer schema)
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_conversations CASCADE;

-- ── Conversations ──
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(200),
  status VARCHAR(30) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'waiting_on_customer', 'waiting_on_agent', 'resolved', 'closed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category VARCHAR(30) NOT NULL DEFAULT 'general_inquiry'
    CHECK (category IN ('booking_issue', 'payment_issue', 'car_problem', 'account_issue', 'general_inquiry', 'complaint', 'other')),
  assigned_agent_id UUID REFERENCES backoffice_users(id),
  related_booking_id UUID REFERENCES bookings(id),
  unread_count_customer INT NOT NULL DEFAULT 0,
  unread_count_agent INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview VARCHAR(150) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_status
  ON conversations(customer_id, status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_status
  ON conversations(assigned_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations(status);

-- ── Messages ──
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  sender_id UUID,
  content TEXT NOT NULL DEFAULT '',
  message_type VARCHAR(20) NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'file', 'system_event', 'canned_response')),
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  original_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read
  ON messages(conversation_id, is_read);

-- ── Canned Responses ──
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  shortcut VARCHAR(30) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut
  ON canned_responses(shortcut);

-- ── Chat Notes (internal, agent-only) ──
CREATE TABLE IF NOT EXISTS chat_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES backoffice_users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_notes_conversation
  ON chat_notes(conversation_id, created_at DESC);

-- ── Seed default canned responses ──
INSERT INTO canned_responses (title, content, category, shortcut) VALUES
  ('Greeting', 'Hello! Welcome to YallaRent support. How can I help you today?', 'Greetings', '/greet'),
  ('Please Hold', 'Let me check on that for you. Please give me a moment.', 'General', '/hold'),
  ('Issue Resolved', 'I''m glad I could help! Is there anything else you need?', 'Closings', '/resolved'),
  ('Closing', 'Thank you for contacting YallaRent. Have a great day!', 'Closings', '/close'),
  ('Refund Policy', 'Refunds typically take 3-5 business days to process. I''ll initiate this for you now.', 'Payments', '/refund'),
  ('Support Hours', 'Our support team is available from 9 AM to 10 PM Iraq time, every day.', 'General', '/hours')
ON CONFLICT (shortcut) DO NOTHING;
