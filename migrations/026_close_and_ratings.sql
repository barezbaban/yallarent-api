-- Add close tracking columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS closed_by VARCHAR(20) DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL;

-- Create conversation_ratings table
CREATE TABLE IF NOT EXISTS conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_conversation_rating UNIQUE (conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_ratings_customer ON conversation_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_conversation ON conversation_ratings(conversation_id);
