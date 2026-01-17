-- Run this in Supabase SQL Editor to add the payments feature

-- Payments table (for marking balances as paid)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  marked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (debtor_id != creditor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_debtor_id ON payments(debtor_id);
CREATE INDEX IF NOT EXISTS idx_payments_creditor_id ON payments(creditor_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Function to update payment updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update payment updated_at
DROP TRIGGER IF EXISTS trigger_update_payment_timestamp ON payments;
CREATE TRIGGER trigger_update_payment_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

-- Enable RLS (Row Level Security) for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payments in their groups
CREATE POLICY "Users can view payments in their groups" ON payments
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert payments if they are the debtor
CREATE POLICY "Debtors can mark payments as paid" ON payments
  FOR INSERT
  WITH CHECK (
    debtor_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Creditors can update payment status (accept/reject)
CREATE POLICY "Creditors can update payments" ON payments
  FOR UPDATE
  USING (
    creditor_id = auth.uid()
  );

