-- Migration to add Support Tickets to Slabofy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_category') THEN
        CREATE TYPE ticket_category AS ENUM (
            'payments_payouts', 
            'order_issue', 
            'product_listing', 
            'account_kyc', 
            'technical_bug', 
            'shiprocket_delivery', 
            'other'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    seller_id INT REFERENCES users(id) ON DELETE CASCADE,
    category ticket_category NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_seller ON support_tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
