-- ==============================================================================
-- SLABOFY — SHIPROCKET INTEGRATION SCHEMA MIGRATION
-- Database Engine: PostgreSQL
-- ==============================================================================

-- 1. Create shipment_status enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status') THEN
        CREATE TYPE shipment_status AS ENUM (
            'pending',
            'created',
            'courier_pending',
            'pickup_scheduled',
            'in_transit',
            'delivered',
            'cancelled',
            'rto'
        );
    END IF;
END $$;

-- 2. Add pickup address fields to seller_profiles
ALTER TABLE seller_profiles
ADD COLUMN IF NOT EXISTS pickup_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pickup_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS pickup_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pickup_pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS pickup_country VARCHAR(50) DEFAULT 'India',
ADD COLUMN IF NOT EXISTS shiprocket_pickup_id VARCHAR(100);

-- 3. Add package dimensions and weight to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) DEFAULT 0.50,
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(6,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS breadth_cm DECIMAL(6,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(6,2) DEFAULT 5.00;

-- 4. Add Shiprocket fields to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS shiprocket_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS awb_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS courier_id INT,
ADD COLUMN IF NOT EXISTS courier_name_sr VARCHAR(255),
ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
ADD COLUMN IF NOT EXISTS shipping_charges DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS shipment_status shipment_status DEFAULT 'pending';

-- 5. Create shipment_tracking table
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    awb_code VARCHAR(100),
    status VARCHAR(100),
    location VARCHAR(255),
    remark TEXT,
    activity_at TIMESTAMPTZ,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order ON shipment_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_awb ON shipment_tracking(awb_code);
