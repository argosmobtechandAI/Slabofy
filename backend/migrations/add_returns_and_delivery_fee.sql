-- 1. Add delivery_fee to products table (Admin controlled, defaults to 0.00)
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0.00;

-- 2. Add 'return_requested' status to order_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_requested' AND enumtypid = 'order_status'::regtype) THEN
        ALTER TYPE order_status ADD VALUE 'return_requested';
    END IF;
END $$;

-- 3. Create return_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_status') THEN
        CREATE TYPE return_status AS ENUM (
          'requested',        -- Customer submitted return
          'seller_approved',   -- Seller approved return & pickup
          'seller_rejected',   -- Seller rejected (eligible for admin review)
          'admin_approved',    -- Admin override approved
          'admin_rejected',    -- Admin closed/denied
          'pickup_done',       -- Courier collected package
          'refunded',          -- 100% refund successfully disbursed
          'closed'             -- Completed & closed
        );
    END IF;
END $$;

-- 4. Create return_reason enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_reason') THEN
        CREATE TYPE return_reason AS ENUM (
          'defective_item',
          'wrong_item_delivered',
          'item_not_as_described',
          'size_fit_issue',
          'changed_mind',
          'damaged_in_transit',
          'missing_parts',
          'other'
        );
    END IF;
END $$;

-- 5. Create return_requests table
CREATE TABLE IF NOT EXISTS return_requests (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    buyer_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    seller_id INT REFERENCES users(id) ON DELETE SET NULL,
    status return_status DEFAULT 'requested',
    reason return_reason NOT NULL,
    description TEXT,
    evidence_images JSONB DEFAULT '[]'::jsonb,
    seller_note TEXT,
    admin_note TEXT,
    refund_amount DECIMAL(10,2) NOT NULL,
    razorpay_refund_id VARCHAR(255),
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_buyer ON return_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_seller ON return_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
